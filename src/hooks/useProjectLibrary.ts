import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ProjectState } from '../types/worksheet'
import {
  buildProjectMeta,
  createProjectMeta,
  duplicateProject,
  getCurrentProjectId,
  isBlankProject,
  listProjects,
  loadProject,
  migrateLegacyDraft,
  removeProject,
  renameProject,
  requestPersistentStorage,
  saveProject,
  setCurrentProjectId,
} from '../projectLibrary'
import type { SavedProjectMeta } from '../projectLibrary'

const AUTOSAVE_DELAY_MS = 1000

/**
 * Start liczony raz na całą aplikację: StrictMode odpala efekt dwa razy, a równoległe
 * przenoszenie starego szkicu utworzyłoby dwie identyczne karty.
 */
let startupPromise: Promise<{ meta: SavedProjectMeta; project: ProjectState } | null> | null = null

function loadStartupProject() {
  startupPromise ??= (async () => {
    await migrateLegacyDraft()
    const currentId = await getCurrentProjectId()
    const current = currentId ? await loadProject(currentId) : null
    if (current) return current
    // Zapamiętana karta zniknęła (albo nigdy jej nie było) - otwieramy ostatnio zmienianą.
    const [latest] = await listProjects()
    return latest ? loadProject(latest.id) : null
  })()
  return startupPromise
}

/**
 * „Moje karty": bieżąca karta zapisuje się sama (z debouncem), a na starcie wraca ostatnio
 * otwarta - bez pytania o szkic. Wszystko żyje w IndexedDB tej przeglądarki.
 */
export function useProjectLibrary(project: ProjectState, onLoad: (state: ProjectState) => void) {
  const [isReady, setIsReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const [currentMeta, setCurrentMeta] = useState<SavedProjectMeta>(() => createProjectMeta())
  const [projects, setProjects] = useState<SavedProjectMeta[]>([])
  const [isPersisted, setIsPersisted] = useState(false)

  // Refy, żeby zapis „teraz" (przed przełączeniem karty) widział najświeższy stan.
  const projectRef = useRef(project)
  const metaRef = useRef(currentMeta)
  const lastSavedRef = useRef<string>('')
  const onLoadRef = useRef(onLoad)
  useLayoutEffect(() => {
    projectRef.current = project
    metaRef.current = currentMeta
    onLoadRef.current = onLoad
  })

  const refreshList = useCallback(async () => {
    try {
      setProjects(await listProjects())
    } catch {
      // Bez IndexedDB lista jest po prostu pusta.
    }
  }, [])

  // `state` podajemy jawnie, gdy karta dopiero co się zmieniła, a ref jeszcze nie (przed renderem).
  const persist = useCallback(async (state?: ProjectState): Promise<void> => {
    const current = state ?? projectRef.current
    const serialized = JSON.stringify(current)
    if (serialized === lastSavedRef.current) return
    // Pusta karta nie ląduje na liście, dopóki ktoś czegoś nie wybierze.
    if (isBlankProject(current) && !lastSavedRef.current) return
    const meta = buildProjectMeta(current, metaRef.current, Date.now())
    await saveProject(meta, current)
    await setCurrentProjectId(meta.id)
    lastSavedRef.current = serialized
    metaRef.current = meta
    setCurrentMeta(meta)
  }, [])

  // Start: przeniesienie starego szkicu, potem otwarcie ostatniej karty.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const loaded = await loadStartupProject()
        if (!cancelled && loaded) {
          lastSavedRef.current = JSON.stringify(loaded.project)
          metaRef.current = loaded.meta
          setCurrentMeta(loaded.meta)
          onLoadRef.current(loaded.project)
        }
        if (!cancelled) setIsPersisted(await requestPersistentStorage())
      } catch {
        // Brak dostępu do IndexedDB nie może blokować pracy w edytorze.
      } finally {
        if (!cancelled) setIsReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Autozapis z debouncem.
  useEffect(() => {
    if (!isReady) return
    const serialized = JSON.stringify(project)
    // Zmiana mogła zostać cofnięta przed końcem debounca - wtedy nie zostawiamy „zapisywanie…".
    if (serialized === lastSavedRef.current || (isBlankProject(project) && !lastSavedRef.current)) {
      setSaveStatus('idle')
      return
    }

    setSaveStatus('saving')
    let isCurrentSave = true
    let clearSavedStatus: number | undefined
    const handler = window.setTimeout(() => {
      persist()
        .then(() => {
          if (!isCurrentSave) return
          setSaveStatus('saved')
          clearSavedStatus = window.setTimeout(() => {
            if (isCurrentSave) setSaveStatus('idle')
          }, 2000)
        })
        .catch(() => {
          if (isCurrentSave) setSaveStatus('idle')
        })
    }, AUTOSAVE_DELAY_MS)

    return () => {
      isCurrentSave = false
      window.clearTimeout(handler)
      if (clearSavedStatus !== undefined) window.clearTimeout(clearSavedStatus)
    }
  }, [project, isReady, persist])

  /** Zapis bez czekania na debounce - przed przełączeniem karty albo przeładowaniem strony. */
  const saveNow = useCallback(() => persist().catch(() => {}), [persist])

  // Zamknięcie karty przeglądarki w trakcie debounca - próbujemy zdążyć z zapisem.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') saveNow()
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', saveNow)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', saveNow)
    }
  }, [saveNow])

  const switchTo = useCallback(
    (meta: SavedProjectMeta, state: ProjectState, isSaved: boolean) => {
      lastSavedRef.current = isSaved ? JSON.stringify(state) : ''
      metaRef.current = meta
      setCurrentMeta(meta)
      onLoadRef.current(state)
      if (isSaved) setCurrentProjectId(meta.id).catch(() => {})
    },
    [],
  )

  const openProject = useCallback(
    async (id: string) => {
      await saveNow()
      const loaded = await loadProject(id)
      if (!loaded) return false
      switchTo(loaded.meta, loaded.project, true)
      await refreshList()
      return true
    },
    [saveNow, switchTo, refreshList],
  )

  /** Nowa karta; `initial` to np. wczytany plik - wtedy od razu trafia na listę. */
  const startProject = useCallback(
    async (initial: ProjectState) => {
      await saveNow()
      switchTo(createProjectMeta(), initial, false)
      if (!isBlankProject(initial)) {
        await persist(initial).catch(() => {})
      }
      await refreshList()
    },
    [saveNow, switchTo, persist, refreshList],
  )

  const rename = useCallback(
    async (id: string, name: string) => {
      if (id === metaRef.current.id) {
        await saveNow()
        const trimmed = name.trim()
        const meta = { ...metaRef.current, name: trimmed || metaRef.current.name, customName: Boolean(trimmed) }
        metaRef.current = meta
        setCurrentMeta(meta)
      }
      await renameProject(id, name).catch(() => {})
      await refreshList()
    },
    [saveNow, refreshList],
  )

  const duplicate = useCallback(
    async (id: string) => {
      if (id === metaRef.current.id) await saveNow()
      await duplicateProject(id).catch(() => null)
      await refreshList()
    },
    [saveNow, refreshList],
  )

  /** Usunięcie bieżącej karty otwiera pustą - `blank` dostarcza App. */
  const remove = useCallback(
    async (id: string, blank: () => ProjectState) => {
      await removeProject(id).catch(() => {})
      if (id === metaRef.current.id) switchTo(createProjectMeta(), blank(), false)
      await refreshList()
    },
    [switchTo, refreshList],
  )

  const exportData = useCallback(
    async (id: string) => {
      if (id === metaRef.current.id) return { name: metaRef.current.name, project: projectRef.current }
      const loaded = await loadProject(id)
      return loaded ? { name: loaded.meta.name, project: loaded.project } : null
    },
    [],
  )

  return {
    isReady,
    saveStatus,
    currentMeta,
    projects,
    isPersisted,
    refreshList,
    saveNow,
    openProject,
    startProject,
    rename,
    duplicate,
    remove,
    exportData,
  }
}
