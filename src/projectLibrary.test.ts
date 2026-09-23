import { describe, expect, it } from 'vitest'
import { buildProjectMeta, createProjectMeta, isBlankProject, isLibraryBackup, planBackupImport, suggestProjectName, summarizeTemplates, UNTITLED_PROJECT_NAME } from './projectLibrary'
import type { LibraryBackup, SavedProjectRecord } from './projectLibrary'
import { applyExample, createBlankProject, createWorksheet } from './projectFactory'
import { WORKSHEET_EXAMPLES } from './examples'
import { projectFileName } from './worksheetIO'
import type { ProjectState } from './types/worksheet'

function projectWith(templates: Array<ProjectState['pages'][number]['tasks'][number]['template']>): ProjectState {
  const project = createBlankProject()
  project.pages[0] = { ...project.pages[0], tasks: templates.map((template) => createWorksheet({ template })) }
  return project
}

describe('Moje karty - nazwy i podsumowanie', () => {
  it('pusta karta jest pusta, a karta z szablonem już nie', () => {
    expect(isBlankProject(createBlankProject())).toBe(true)
    expect(isBlankProject(projectWith(['maze']))).toBe(false)
  })

  it('karta z samym tytułem nie jest pusta', () => {
    const project = createBlankProject()
    project.pages[0] = { ...project.pages[0], header: { ...project.pages[0].header, title: 'Moja karta' } }
    expect(isBlankProject(project)).toBe(false)
  })

  it('nazwa pochodzi z widocznego tytułu strony', () => {
    const project = applyExample(createBlankProject(), WORKSHEET_EXAMPLES[0])
    expect(suggestProjectName(project)).toBe('Zwierzęta na wsi')
  })

  it('bez tytułu nazwa pochodzi z typów kart', () => {
    expect(suggestProjectName(projectWith(['maze', 'clock']))).toBe('Labirynt, Zegar')
    expect(suggestProjectName(projectWith(['maze', 'clock', 'math']))).toBe('Labirynt, Zegar i inne')
    expect(suggestProjectName(createBlankProject())).toBe(UNTITLED_PROJECT_NAME)
  })

  it('szablony liczone bez powtórzeń, w kolejności', () => {
    expect(summarizeTemplates(projectWith(['math', null, 'maze', 'math']))).toEqual(['math', 'maze'])
  })

  it('ręcznie nadana nazwa nie jest nadpisywana tytułem', () => {
    const project = applyExample(createBlankProject(), WORKSHEET_EXAMPLES[0])
    const custom = { ...createProjectMeta(0), name: 'Klasa 2b', customName: true }
    expect(buildProjectMeta(project, custom, 1).name).toBe('Klasa 2b')
    expect(buildProjectMeta(project, createProjectMeta(0), 1).name).toBe('Zwierzęta na wsi')
  })
})

describe('projectFileName', () => {
  const date = new Date('2026-09-23T10:00:00Z')

  it('zamienia polskie znaki i spacje', () => {
    expect(projectFileName('Żółć i Łódź - klasa 2', date)).toBe('kartolab-zolc-i-lodz-klasa-2-2026-09-23.json')
  })

  it('bez nazwy zostaje sama data', () => {
    expect(projectFileName(undefined, date)).toBe('kartolab-2026-09-23.json')
    expect(projectFileName('!!!', date)).toBe('kartolab-2026-09-23.json')
  })
})

describe('kopia wszystkich kart', () => {
  function record(id: string, project: ProjectState, name = 'Karta'): SavedProjectRecord {
    return { ...buildProjectMeta(project, { id, name, customName: true, createdAt: 1 }, 2), data: JSON.stringify(project) }
  }
  function backupOf(records: SavedProjectRecord[]): LibraryBackup {
    return { format: 'kartolab-backup', version: 1, exportedAt: '2026-09-23T00:00:00.000Z', projects: records }
  }

  it('rozpoznaje plik z kopią, ale nie pojedynczą kartę', () => {
    expect(isLibraryBackup(backupOf([]))).toBe(true)
    expect(isLibraryBackup(createBlankProject())).toBe(false)
    expect(isLibraryBackup(null)).toBe(false)
  })

  it('dodaje nowe karty, pomija identyczne i nie nadpisuje zmienionych', () => {
    const maze = projectWith(['maze'])
    const clock = projectWith(['clock'])
    const existing = [record('same', maze), record('changed', maze, 'Moja wersja')]
    const backup = backupOf([record('same', maze), record('changed', clock, 'Z kopii'), record('new', clock, 'Nowa')])

    const { toAdd, skipped, invalid } = planBackupImport(backup, existing)

    expect(skipped).toBe(1)
    expect(invalid).toBe(0)
    expect(toAdd.map((entry) => entry.name)).toEqual(['Z kopii (z kopii)', 'Nowa'])
    // Zmieniona karta trafia jako osobna - nowe id, oryginał zostaje nietknięty.
    expect(toAdd[0].id).not.toBe('changed')
    expect(toAdd[1].id).toBe('new')
  })

  it('odrzuca uszkodzone wpisy', () => {
    const broken = { ...record('x', projectWith(['maze'])), data: '{nie json' }
    const { toAdd, invalid } = planBackupImport(backupOf([broken]), [])
    expect(toAdd).toEqual([])
    expect(invalid).toBe(1)
  })
})
