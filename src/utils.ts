// Drobne funkcje pomocnicze używane w całej aplikacji.

/** Prosty generator unikalnych identyfikatorów (wystarczający dla listy w pamięci). */
export function createId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/**
 * Deterministyczny hash tekstu na liczbę w zakresie [0, 1).
 * Używany do wyliczania "losowych", ale stabilnych pozycji w układzie rozrzuconym
 * (te same dane wejściowe zawsze dają tę samą pozycję, dopóki nie zmieni się seed).
 */
export function hashToUnit(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return (Math.abs(hash) % 1000) / 1000
}

/** Ogranicza wartość do podanego zakresu. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** Tasowanie deterministyczne na podstawie seeda. */
export function shuffleArraySeeded<T>(items: T[], seed: number): T[] {
  const result = [...items]
  let currentSeed = seed
  for (let i = result.length - 1; i > 0; i--) {
    const r = seededRandom(currentSeed++)
    const j = Math.floor(r * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
