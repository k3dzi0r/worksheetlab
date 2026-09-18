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
    get<string>(AUTOSAVE_KEY).then((data) => {
      if (data) {
        setHasDraft(true)
      }
      setIsReady(true)
    })
  }, [])

  // Autosave z debouncem (1 sekunda)
  useEffect(() => {
    // Nie zapisujemy automatycznie, dopóki nie rozstrzygniemy co z draftem
    if (!isReady || hasDraft) return

    if (isFirstRender.current) {
      isFirstRender.current = false
      lastSavedState.current = JSON.stringify(project)
      return
    }

    const currentSerialized = JSON.stringify(project)
    if (currentSerialized === lastSavedState.current) return

    setSaveStatus('saving')
    
    const handler = setTimeout(() => {
      set(AUTOSAVE_KEY, currentSerialized).then(() => {
        lastSavedState.current = currentSerialized
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      })
    }, 1000)

    return () => clearTimeout(handler)
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
