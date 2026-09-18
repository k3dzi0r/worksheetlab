// Generator zadań z zegarem.
//
// Jedno zadanie to godzina plus rodzaj ćwiczenia: albo dziecko odczytuje wskazówki
// i zapisuje godzinę, albo dostaje godzinę zapisaną i samo rysuje wskazówki.

import { createSeededRandom } from './utils'

export type ClockMode = 'read' | 'draw' | 'mixed'

/** Z jaką dokładnością losujemy godziny - to główne pokrętło trudności. */
export const CLOCK_PRECISIONS = [
  { value: 'hour', label: 'Pełne godziny', step: 60 },
  { value: 'half', label: 'Pół godziny', step: 30 },
  { value: 'quarter', label: 'Kwadranse', step: 15 },
  { value: 'five', label: 'Co 5 minut', step: 5 },
  { value: 'minute', label: 'Co minutę', step: 1 },
] as const

export type ClockPrecision = (typeof CLOCK_PRECISIONS)[number]['value']

export function getClockPrecision(value: string | undefined) {
  return CLOCK_PRECISIONS.find((precision) => precision.value === value) ?? CLOCK_PRECISIONS[0]
}

export interface ClockTask {
  /** Godzina 0-23; na tarczy pokazujemy resztę z dzielenia przez 12. */
  hour: number
  minute: number
  /** Czy dziecko odczytuje godzinę, czy rysuje wskazówki. */
  task: 'read' | 'draw'
}

export interface ClockOptions {
  count: number
  mode: ClockMode
  precision: ClockPrecision
  /** Zapis 24-godzinny losuje też godziny popołudniowe (15:00 zamiast 3:00). */
  format24: boolean
  seed: number
}

/** Zapis godziny w formie, w jakiej dziecko ma ją zapisać. */
export function formatClockTime(hour: number, minute: number, format24: boolean): string {
  const shown = format24 ? hour : hour % 12 === 0 ? 12 : hour % 12
  return `${shown}:${String(minute).padStart(2, '0')}`
}

export function generateClockTasks(options: ClockOptions): ClockTask[] {
  const { count, mode, precision, format24, seed } = options
  const random = createSeededRandom(seed)
  const step = getClockPrecision(precision).step

  const tasks: ClockTask[] = []
  const used = new Set<string>()

  for (let i = 0; i < count; i++) {
    let hour = 0
    let minute = 0

    // Kilka podejść, żeby ta sama godzina nie powtórzyła się na jednej kartce.
    for (let attempt = 0; attempt < 12; attempt++) {
      hour = format24 ? Math.floor(random() * 24) : 1 + Math.floor(random() * 12)
      minute = Math.floor(random() * (60 / step)) * step
      const key = `${hour}:${minute}`
      if (!used.has(key) || attempt === 11) {
        used.add(key)
        break
      }
    }

    // W trybie „na zmianę" rodzaj ćwiczenia przeplatamy, żeby obu było po równo.
    const task = mode === 'mixed' ? (i % 2 === 0 ? 'read' : 'draw') : mode
    tasks.push({ hour, minute, task })
  }

  return tasks
}
