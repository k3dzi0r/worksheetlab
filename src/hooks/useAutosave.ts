import { useEffect, useRef, useState } from 'react'
import { set, get, del } from '../idb'
import type { WorksheetState } from '../types/worksheet'

import { parseWorksheetJson } from '../worksheetIO'

const AUTOSAVE_KEY = 'worksheet-autosave'

export function useAutosave(
  worksheet: WorksheetState,
  onRestore: (state: WorksheetState) => void
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
      lastSavedState.current = JSON.stringify(worksheet)
      return
    }

    const currentSerialized = JSON.stringify(worksheet)
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
  }, [worksheet, isReady, hasDraft])

  const loadDraft = async () => {
    const data = await get<string>(AUTOSAVE_KEY)
    if (data) {
      const parsed = parseWorksheetJson(data)
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
