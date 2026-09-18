import { useState, useCallback, useEffect, useRef } from 'react'

export function useUndoRedo<T>(initialState: T) {
  const [past, setPast] = useState<T[]>([])
  const [present, setPresent] = useState<T>(initialState)
  const [future, setFuture] = useState<T[]>([])

  const lastPushTime = useRef(0)

  const undo = useCallback(() => {
    if (past.length === 0) return
    
    const previous = past[past.length - 1]
    setPast((p) => p.slice(0, p.length - 1))
    setFuture((f) => [present, ...f])
    setPresent(previous)
    lastPushTime.current = 0
  }, [past, present])

  const redo = useCallback(() => {
    if (future.length === 0) return
    
    const next = future[0]
    setPast((p) => [...p, present])
    setFuture((f) => f.slice(1))
    setPresent(next)
    lastPushTime.current = 0
  }, [future, present])

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setPresent((prev) => {
      const nextState = typeof newState === 'function' ? (newState as any)(prev) : newState
      if (prev === nextState) return prev

      const now = Date.now()
      const timeSinceLastPush = now - lastPushTime.current
      
      // Grupowanie zmian: jeśli użytkownik pisze szybko, nie dodajemy
      // każdego znaku do historii jako osobnego kroku.
      if (timeSinceLastPush > 1000) {
        setPast((p) => {
          const newPast = [...p, prev]
          if (newPast.length > 50) newPast.shift()
          return newPast
        })
      }
      
      lastPushTime.current = now
      setFuture([]) // Nowa zmiana niszczy gałąź redo
      return nextState
    })
  }, [])

  const reset = useCallback((newState: T) => {
    setPast([])
    setPresent(newState)
    setFuture([])
    lastPushTime.current = 0
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorujemy skróty, jeśli użytkownik wpisuje tekst - wtedy działa natywne Undo przeglądarki
      // w obrębie danego pola tekstowego.
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Pozwalamy jednak wyłapać Cmd+Z, jeśli chcemy globalne undo? 
        // Lepiej zostawić przeglądarce natywne undo edycji tekstu.
        return
      }

      const isMac = navigator.userAgent.toLowerCase().includes('mac')
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey

      if (ctrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      } else if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        redo()
      } else if (ctrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    state: present,
    set,
    reset,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
