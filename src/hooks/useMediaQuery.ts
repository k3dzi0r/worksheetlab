import { useSyncExternalStore } from 'react'

/** Czy pasuje zapytanie CSS - np. układ telefonu, w którym treść kroku jest wysuwanym arkuszem. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
