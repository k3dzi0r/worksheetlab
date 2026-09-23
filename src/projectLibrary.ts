import { del, deleteProject, get, getAllProjects, getProject, putProject, set } from './idb'
import { TEMPLATE_OPTIONS } from './types/worksheet'
import type { ProjectState, TemplateType } from './types/worksheet'
import { parseProjectJson } from './worksheetIO'
import { createId } from './utils'

/** Klucz jedynego szkicu sprzed „Moich kart" - przenoszony do biblioteki przy pierwszym uruchomieniu. */
const LEGACY_AUTOSAVE_KEY = 'worksheet-autosave'
const CURRENT_PROJECT_KEY = 'current-project-id'

export const UNTITLED_PROJECT_NAME = 'Karta bez nazwy'

/** To, co pokazujemy na liście - bez ciężkiej treści projektu (obrazki w base64). */
export interface SavedProjectMeta {
  id: string
  name: string
  /** Nazwa wpisana ręcznie - wtedy nie nadpisujemy jej tytułem z nagłówka. */
  customName: boolean
  createdAt: number
  updatedAt: number
  pageCount: number
  templates: TemplateType[]
}

export interface SavedProjectRecord extends SavedProjectMeta {
  /** Projekt jako JSON - ten sam format co eksport do pliku. */
  data: string
}

/** Karta, w której nie wybrano jeszcze żadnego szablonu - takiej nie ma sensu zapisywać na liście. */
export function isBlankProject(project: ProjectState): boolean {
  return project.pages.every((page) => page.tasks.every((task) => task.template === null) && !page.header.title.trim())
}

/** Nazwa z tytułu pierwszej strony, a bez tytułu - z typów kart. */
export function suggestProjectName(project: ProjectState): string {
  const title = project.pages.map((page) => (page.header.showTitle ? page.header.title.trim() : '')).find(Boolean)
  if (title) return title
  const labels = summarizeTemplates(project).map((template) => TEMPLATE_OPTIONS.find((option) => option.value === template)?.label)
  const named = labels.filter((label): label is string => Boolean(label))
  if (named.length === 0) return UNTITLED_PROJECT_NAME
  return named.length > 2 ? `${named.slice(0, 2).join(', ')} i inne` : named.join(', ')
}

/** Użyte szablony w kolejności wystąpienia, bez powtórzeń. */
export function summarizeTemplates(project: ProjectState): TemplateType[] {
  const templates: TemplateType[] = []
  for (const page of project.pages) {
    for (const task of page.tasks) {
      if (task.template && !templates.includes(task.template)) templates.push(task.template)
    }
  }
  return templates
}

export function buildProjectMeta(
  project: ProjectState,
  previous: Pick<SavedProjectMeta, 'id' | 'name' | 'customName' | 'createdAt'>,
  now: number,
): SavedProjectMeta {
  return {
    id: previous.id,
    name: previous.customName ? previous.name : suggestProjectName(project),
    customName: previous.customName,
    createdAt: previous.createdAt,
    updatedAt: now,
    pageCount: project.pages.length,
    templates: summarizeTemplates(project),
  }
}

export function createProjectMeta(now = Date.now()): SavedProjectMeta {
  return { id: createId(), name: UNTITLED_PROJECT_NAME, customName: false, createdAt: now, updatedAt: now, pageCount: 1, templates: [] }
}

export async function listProjects(): Promise<SavedProjectMeta[]> {
  const records = await getAllProjects<SavedProjectRecord>()
  return records
    .map(({ data: _data, ...meta }) => meta)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function loadProject(id: string): Promise<{ meta: SavedProjectMeta; project: ProjectState } | null> {
  const record = await getProject<SavedProjectRecord>(id)
  if (!record) return null
  const project = parseProjectJson(record.data)
  if (!project) return null
  const { data: _data, ...meta } = record
  return { meta, project }
}

export function saveProject(meta: SavedProjectMeta, project: ProjectState): Promise<void> {
  return putProject<SavedProjectRecord>({ ...meta, data: JSON.stringify(project) })
}

export function removeProject(id: string): Promise<void> {
  return deleteProject(id)
}

export async function renameProject(id: string, name: string): Promise<void> {
  const record = await getProject<SavedProjectRecord>(id)
  if (!record) return
  const trimmed = name.trim()
  await putProject<SavedProjectRecord>({ ...record, name: trimmed || UNTITLED_PROJECT_NAME, customName: Boolean(trimmed) })
}

export async function duplicateProject(id: string): Promise<SavedProjectMeta | null> {
  const record = await getProject<SavedProjectRecord>(id)
  if (!record) return null
  const now = Date.now()
  const copy: SavedProjectRecord = { ...record, id: createId(), name: `${record.name} (kopia)`, customName: true, createdAt: now, updatedAt: now }
  await putProject(copy)
  const { data: _data, ...meta } = copy
  return meta
}

export function getCurrentProjectId(): Promise<string | undefined> {
  return get<string>(CURRENT_PROJECT_KEY)
}

export function setCurrentProjectId(id: string): Promise<void> {
  return set(CURRENT_PROJECT_KEY, id)
}

/**
 * Jednorazowe przeniesienie starego szkicu do „Moich kart". Zwraca id karty albo undefined,
 * gdy nie było czego przenosić.
 */
export async function migrateLegacyDraft(): Promise<string | undefined> {
  const data = await get<string>(LEGACY_AUTOSAVE_KEY)
  if (!data) return undefined
  const project = parseProjectJson(data)
  if (project && !isBlankProject(project)) {
    const meta = buildProjectMeta(project, createProjectMeta(), Date.now())
    await saveProject(meta, project)
    await setCurrentProjectId(meta.id)
    await del(LEGACY_AUTOSAVE_KEY)
    return meta.id
  }
  await del(LEGACY_AUTOSAVE_KEY)
  return undefined
}

const BACKUP_FORMAT = 'kartolab-backup'

/** Kopia wszystkich kart w jednym pliku - jedyna ochrona przed wyczyszczeniem danych przeglądarki. */
export interface LibraryBackup {
  format: typeof BACKUP_FORMAT
  version: 1
  exportedAt: string
  projects: SavedProjectRecord[]
}

export function isLibraryBackup(value: unknown): value is LibraryBackup {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as LibraryBackup).format === BACKUP_FORMAT &&
    Array.isArray((value as LibraryBackup).projects)
  )
}

export async function exportLibrary(now = new Date()): Promise<LibraryBackup> {
  const records = await getAllProjects<SavedProjectRecord>()
  return { format: BACKUP_FORMAT, version: 1, exportedAt: now.toISOString(), projects: records }
}

/**
 * Wybiera z kopii karty do dodania. Nic nie nadpisuje: karta, która już jest w identycznej
 * wersji, jest pomijana, a inna wersja tej samej karty trafia na listę jako osobna kopia.
 * Rekordy z uszkodzoną treścią są odrzucane.
 */
export function planBackupImport(
  backup: LibraryBackup,
  existing: Pick<SavedProjectRecord, 'id' | 'data'>[],
): { toAdd: SavedProjectRecord[]; skipped: number; invalid: number } {
  const byId = new Map(existing.map((record) => [record.id, record.data]))
  const toAdd: SavedProjectRecord[] = []
  let skipped = 0
  let invalid = 0
  for (const raw of backup.projects) {
    const project = typeof raw?.data === 'string' ? parseProjectJson(raw.data) : null
    if (!project || typeof raw.id !== 'string') {
      invalid++
      continue
    }
    const now = Date.now()
    const meta = buildProjectMeta(
      project,
      {
        id: raw.id,
        name: typeof raw.name === 'string' ? raw.name : UNTITLED_PROJECT_NAME,
        customName: Boolean(raw.customName),
        createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
      },
      typeof raw.updatedAt === 'number' ? raw.updatedAt : now,
    )
    const current = byId.get(raw.id)
    if (current === raw.data) {
      skipped++
    } else if (current !== undefined) {
      toAdd.push({ ...meta, id: createId(), name: `${meta.name} (z kopii)`, customName: true, data: raw.data })
    } else {
      toAdd.push({ ...meta, data: raw.data })
    }
  }
  return { toAdd, skipped, invalid }
}

export async function importLibrary(backup: LibraryBackup): Promise<{ added: number; skipped: number; invalid: number }> {
  const existing = await getAllProjects<SavedProjectRecord>()
  const { toAdd, skipped, invalid } = planBackupImport(backup, existing)
  for (const record of toAdd) await putProject(record)
  return { added: toAdd.length, skipped, invalid }
}

/** Plik z kopią - nazwa z datą, żeby kolejne kopie się nie nadpisywały. */
export function downloadLibraryBackup(backup: LibraryBackup) {
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `kartolab-kopia-${backup.exportedAt.slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Prośba, żeby przeglądarka nie czyściła danych przy braku miejsca. Nie chroni przed
 * ręcznym wyczyszczeniem danych ani trybem prywatnym - stąd ostrzeżenie w „Moich kartach".
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
