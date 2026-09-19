// Generator działań matematycznych dla klas 1-3.
// Działania powstają z reguł dydaktycznych, a nie z losowania liczb na ślepo:
// odejmowanie nigdy nie schodzi poniżej zera, dzielenie zawsze dzieli się bez reszty,
// a tryb bez przekraczania progu dziesiątkowego naprawdę tego progu nie przekracza.

import { createSeededRandom } from './utils'

export type MathOperation = 'add' | 'sub' | 'mul' | 'div'

/** Które miejsce w działaniu jest puste do uzupełnienia. */
export type MathMissing = 'result' | 'operand' | 'mixed'

export interface MathTask {
  left: number
  right: number
  operation: MathOperation
  result: number
  /** Indeks pustego miejsca: 0 - pierwszy składnik, 1 - drugi, 2 - wynik. */
  blank: 0 | 1 | 2
}

export interface MathOptions {
  operations: MathOperation[]
  /** Górna granica zakresu liczbowego (10, 20, 100...). */
  max: number
  /** Czy wolno przekraczać próg dziesiątkowy przy dodawaniu i odejmowaniu. */
  crossTen: boolean
  missing: MathMissing
  count: number
  seed: number
}

export const MATH_OPERATION_SIGNS: Record<MathOperation, string> = {
  add: '+',
  sub: '−',
  mul: '×',
  div: ':',
}

export const MATH_OPERATION_LABELS: Record<MathOperation, string> = {
  add: 'Dodawanie',
  sub: 'Odejmowanie',
  mul: 'Mnożenie',
  div: 'Dzielenie',
}

function randomInt(random: () => number, min: number, max: number) {
  return min + Math.floor(random() * (max - min + 1))
}

/**
 * Dodawanie. Bez przekraczania progu suma jedności nie może przekroczyć 9,
 * czyli dziecko liczy w obrębie jednej dziesiątki.
 */
function makeAddition(random: () => number, max: number, crossTen: boolean) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const left = randomInt(random, 1, max - 1)
    const right = randomInt(random, 1, max - left)
    if (!crossTen && (left % 10) + (right % 10) > 9) continue
    return { left, right, result: left + right }
  }
  // Wyjście awaryjne: działanie zawsze mieszczące się w regułach.
  return { left: 1, right: 1, result: 2 }
}

/** Odejmowanie. Wynik nigdy nie jest ujemny, a bez przekraczania progu nie pożyczamy dziesiątki. */
function makeSubtraction(random: () => number, max: number, crossTen: boolean) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const left = randomInt(random, 2, max)
    const right = randomInt(random, 1, left - 1)
    if (!crossTen && left % 10 < right % 10) continue
    return { left, right, result: left - right }
  }
  return { left: 2, right: 1, result: 1 }
}

/** Mnożenie w granicach tabliczki mieszczącej się w zakresie. */
function makeMultiplication(random: () => number, max: number) {
  const limit = Math.max(2, Math.min(10, Math.floor(Math.sqrt(max) * 2)))
  for (let attempt = 0; attempt < 40; attempt++) {
    const left = randomInt(random, 2, limit)
    const right = randomInt(random, 2, limit)
    if (left * right > max) continue
    return { left, right, result: left * right }
  }
  return { left: 2, right: 2, result: 4 }
}

/** Dzielenie budujemy z mnożenia, więc zawsze dzieli się bez reszty. */
function makeDivision(random: () => number, max: number) {
  const { left, right, result } = makeMultiplication(random, max)
  return { left: result, right, result: left }
}

/** Losuje, które miejsce w działaniu zostaje puste. */
function pickBlank(random: () => number, missing: MathMissing): 0 | 1 | 2 {
  if (missing === 'result') return 2
  if (missing === 'operand') return random() < 0.5 ? 0 : 1
  const roll = random()
  if (roll < 0.6) return 2
  return roll < 0.8 ? 0 : 1
}

export function generateMathTasks(options: MathOptions): MathTask[] {
  const { operations, max, crossTen, missing, count, seed } = options
  const random = createSeededRandom(seed)
  const active = operations.length > 0 ? operations : (['add'] as MathOperation[])

  const tasks: MathTask[] = []
  for (let i = 0; i < count; i++) {
    // Działania przeplatamy po kolei, żeby każdy zaznaczony rodzaj pojawił się równomiernie.
    const operation = active[i % active.length]
    const base =
      operation === 'add'
        ? makeAddition(random, max, crossTen)
        : operation === 'sub'
          ? makeSubtraction(random, max, crossTen)
          : operation === 'mul'
            ? makeMultiplication(random, max)
            : makeDivision(random, max)

    tasks.push({ ...base, operation, blank: pickBlank(random, missing) })
  }

  return tasks
}
