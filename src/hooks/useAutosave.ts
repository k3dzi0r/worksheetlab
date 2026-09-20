import { useEffect, useRef, useState } from 'react'
import { set, get, del } from '../idb'
import type { ProjectState } from '../types/worksheet'

import { parseProjectJson } from '../worksheetIO'

const AUTOSAVE_KEY = 'worksheet-autosave'

export function useAutosave(
  project: ProjectState,
  onRestore: (state: ProjectState) => void
) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const [hasDraft, setHasDraft] = useState(false)
  const isFirstRender = useRef(true)
  const lastSavedState = useRef<string>('')
  const [isReady, setIsReady] = useState(false)

  // Sprawdzanie draftu na starcie
  useEffect(() => {
    get<string>(AUTOSAVE_KEY)
      .then((data) => {
        if (data) setHasDraft(true)
      })
      .catch(() => {
        // Brak dostępu do IndexedDB nie może blokować pracy w edytorze.
      })
      .finally(() => setIsReady(true))
  }, [])

  // Autosave z debouncem (1 sekunda)
  useEffect(() => {
    // Nie zapisujemy automatycznie, dopóki nie rozstrzygniemy co z draftem
    if (!isReady || hasDraft) return

    if (isFirstRender.current) {
      isFirstRender.current = false
      lastSavedState.current = JSON.stringify(project)
      setSaveStatus('idle')
      return
    }

    const currentSerialized = JSON.stringify(project)
    // Zmiana mogła zostać cofnięta przed końcem debounca. Wtedy poprzedni timer
    // jest anulowany przez cleanup, więc nie wolno zostawić statusu „zapisywanie…”.
    if (currentSerialized === lastSavedState.current) {
      setSaveStatus('idle')
      return
    }

    setSaveStatus('saving')

    let isCurrentSave = true
    let clearSavedStatus: number | undefined
    const handler = window.setTimeout(() => {
      set(AUTOSAVE_KEY, currentSerialized)
        .then(() => {
          if (!isCurrentSave) return
          lastSavedState.current = currentSerialized
          setSaveStatus('saved')
          clearSavedStatus = window.setTimeout(() => {
            if (isCurrentSave) setSaveStatus('idle')
          }, 2000)
        })
        .catch(() => {
          if (isCurrentSave) setSaveStatus('idle')
        })
    }, 1000)

    return () => {
      isCurrentSave = false
      window.clearTimeout(handler)
      if (clearSavedStatus !== undefined) window.clearTimeout(clearSavedStatus)
    }
  }, [project, isReady, hasDraft])

  const loadDraft = async () => {
    const data = await get<string>(AUTOSAVE_KEY)
    if (data) {
      const parsed = parseProjectJson(data)
      if (parsed) onRestore(parsed)
    }
    setHasDraft(false)
  }

  const deleteDraft = async () => {
    await del(AUTOSAVE_KEY)
    setHasDraft(false)
  }

  return { isReady, saveStatus, hasDraft, loadDraft, deleteDraft }
}
