// Drobne funkcje pomocnicze używane w całej aplikacji.

/** Prosty generator unikalnych identyfikatorów (wystarczający dla listy w pamięci). */
export function createId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** Tasowanie tablicy algorytmem Fisher-Yates (nie modyfikuje oryginału). */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
