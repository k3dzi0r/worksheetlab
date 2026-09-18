// Generator zadania „połącz kropki".
//
// Każdy obrazek to zamknięty kontur opisany punktami w układzie 0..1. Kropki rozstawiamy
// wzdłuż konturu w równych odstępach mierzonych po jego długości, a nie co któryś punkt -
// inaczej w miejscach gęściej opisanych (np. na zaokrągleniach) kropki tłoczyłyby się,
// a na długich prostych byłyby rzadkie.

import { createSeededRandom } from './utils'

export type DotPoint = [number, number]

export interface DotShape {
  id: string
  label: string
  /** Punkty konturu w układzie 0..1, liczone od lewego górnego rogu. */
  points: DotPoint[]
}

/** Zamienia funkcję parametryczną na listę punktów konturu. */
function sampleCurve(steps: number, fn: (t: number) => DotPoint): DotPoint[] {
  return Array.from({ length: steps }, (_, i) => fn(i / steps))
}

/**
 * Sprowadza kontur do układu, w którym dłuższy bok ma długość 1, a krótszy zachowuje
 * proporcję. Nie dopychamy kształtu do kwadratu - szablon dopasowuje potem rysunek do
 * proporcji wolnego miejsca, więc rybka rozciąga się na szerokość, a rakieta na wysokość.
 */
function normalize(points: DotPoint[]): DotPoint[] {
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY)
  return points.map(([x, y]) => [(x - minX) / span, (y - minY) / span])
}

const heart = sampleCurve(180, (t) => {
  const angle = t * Math.PI * 2
  const x = 16 * Math.sin(angle) ** 3
  const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle))
  return [x, y]
})

const star = Array.from({ length: 10 }, (_, i): DotPoint => {
  const angle = (Math.PI * i) / 5 - Math.PI / 2
  const radius = i % 2 === 0 ? 1 : 0.42
  return [radius * Math.cos(angle), radius * Math.sin(angle)]
})

const flower = sampleCurve(180, (t) => {
  const angle = t * Math.PI * 2
  // Krzywa różyczkowa: pięć łagodnych płatków. Głębsze wcięcia rozsypują się przy
  // małej liczbie kropek, bo na płatek przypadają wtedy dwie, trzy kropki.
  const radius = 0.74 + 0.26 * Math.cos(5 * angle)
  return [radius * Math.cos(angle), radius * Math.sin(angle)]
})

// Krzywa motyla Fay'a przechodzi przez środek i po rozstawieniu kropek zamienia się
// w gwiazdę z kresek, dlatego motyl jest tu zwykłym wielokątem: dwa skrzydła i tułów.
const butterfly: DotPoint[] = [
  [0.5, 0.18],
  [0.62, 0.05],
  [0.86, 0.0],
  [0.98, 0.22],
  [0.9, 0.44],
  [0.62, 0.46],
  [0.72, 0.62],
  [0.9, 0.82],
  [0.72, 1.0],
  [0.54, 0.86],
  [0.5, 0.9],
  [0.46, 0.86],
  [0.28, 1.0],
  [0.1, 0.82],
  [0.28, 0.62],
  [0.38, 0.46],
  [0.1, 0.44],
  [0.02, 0.22],
  [0.14, 0.0],
  [0.38, 0.05],
]

export const DOT_SHAPES: DotShape[] = [
  { id: 'star', label: 'Gwiazda', points: normalize(star) },
  { id: 'heart', label: 'Serce', points: normalize(heart) },
  { id: 'flower', label: 'Kwiatek', points: normalize(flower) },
  { id: 'butterfly', label: 'Motyl', points: normalize(butterfly) },
  {
    id: 'house',
    label: 'Domek',
    points: normalize([
      [0.5, 0],
      [1, 0.38],
      [0.88, 0.38],
      [0.88, 1],
      [0.62, 1],
      [0.62, 0.66],
      [0.38, 0.66],
      [0.38, 1],
      [0.12, 1],
      [0.12, 0.38],
      [0, 0.38],
    ]),
  },
  {
    id: 'tree',
    label: 'Choinka',
    points: normalize([
      [0.5, 0],
      [0.72, 0.28],
      [0.62, 0.28],
      [0.84, 0.56],
      [0.72, 0.56],
      [1, 0.84],
      [0.58, 0.84],
      [0.58, 1],
      [0.42, 1],
      [0.42, 0.84],
      [0, 0.84],
      [0.28, 0.56],
      [0.16, 0.56],
      [0.38, 0.28],
      [0.28, 0.28],
    ]),
  },
  {
    id: 'fish',
    label: 'Rybka',
    points: normalize([
      [0, 0.5],
      [0.18, 0.28],
      [0.42, 0.2],
      [0.66, 0.26],
      [0.82, 0.4],
      [1, 0.18],
      [0.94, 0.5],
      [1, 0.82],
      [0.82, 0.6],
      [0.66, 0.74],
      [0.42, 0.8],
      [0.18, 0.72],
    ]),
  },
  {
    id: 'boat',
    label: 'Żaglówka',
    points: normalize([
      [0.5, 0],
      [0.86, 0.6],
      [0.56, 0.6],
      [0.56, 0.68],
      [1, 0.68],
      [0.84, 1],
      [0.16, 1],
      [0, 0.68],
      [0.44, 0.68],
      [0.44, 0.6],
      [0.14, 0.6],
    ]),
  },
  {
    id: 'rocket',
    label: 'Rakieta',
    points: normalize([
      [0.5, 0],
      [0.68, 0.22],
      [0.68, 0.62],
      [0.9, 0.82],
      [0.9, 1],
      [0.62, 0.88],
      [0.5, 1],
      [0.38, 0.88],
      [0.1, 1],
      [0.1, 0.82],
      [0.32, 0.62],
      [0.32, 0.22],
    ]),
  },
  {
    id: 'apple',
    label: 'Jabłko',
    points: normalize([
      [0.5, 0.12],
      [0.62, 0.02],
      [0.78, 0.0],
      [0.92, 0.12],
      [1.0, 0.34],
      [0.98, 0.62],
      [0.86, 0.88],
      [0.68, 1.0],
      [0.5, 0.92],
      [0.32, 1.0],
      [0.14, 0.88],
      [0.02, 0.62],
      [0.0, 0.34],
      [0.08, 0.12],
      [0.22, 0.0],
      [0.38, 0.02],
    ]),
  },
]

export function getDotShape(id: string | undefined): DotShape {
  return DOT_SHAPES.find((shape) => shape.id === id) ?? DOT_SHAPES[0]
}

/** Sposób numerowania kropek - każdy ćwiczy co innego. */
export const DOT_NUMBERING = [
  { value: 'numbers', label: 'Liczby' },
  { value: 'evens', label: 'Co drugi' },
  { value: 'backwards', label: 'Wspak' },
  { value: 'letters', label: 'Litery' },
] as const

export type DotNumbering = (typeof DOT_NUMBERING)[number]['value']

/** Polski alfabet bez liter, których dziecko nie ćwiczy na tym etapie. */
const LETTERS = 'ABCDEFGHIJKLMNOPRSTUWYZ'

export function dotLabel(index: number, count: number, numbering: DotNumbering): string {
  if (numbering === 'letters') return LETTERS[index % LETTERS.length]
  if (numbering === 'evens') return String((index + 1) * 2)
  if (numbering === 'backwards') return String(count - index)
  return String(index + 1)
}

export interface DotToDotOptions {
  shape: DotShape
  count: number
  seed: number
}

export interface DotToDotResult {
  /** Kropki w kolejności łączenia, we współrzędnych 0..1. */
  dots: DotPoint[]
}

/**
 * Rozstawia kropki wzdłuż konturu.
 *
 * Dla kształtów opisanych wielokątem (domek, rakieta, motyl) najpierw stawiamy kropkę
 * w każdym wierzchołku, a dopiero resztę dokładamy na najdłuższych odcinkach. Samo
 * rozstawianie co równą odległość ścinało narożniki i gubiło drobne elementy - żaglówka
 * traciła maszt, a domek komin.
 *
 * Kształty opisane krzywą mają więcej punktów niż kropek, więc tam kropki rozstawiamy
 * w równych odstępach mierzonych po długości konturu.
 */
export function buildDotToDot({ shape, count, seed }: DotToDotOptions): DotToDotResult {
  const random = createSeededRandom(seed)
  const points = shape.points
  const total = points.length

  if (count >= total) {
    // Wierzchołki zostają, a wolne kropki trafiają tam, gdzie odstęp jest największy.
    const segments = points.map((point, index) => ({
      from: point,
      to: points[(index + 1) % total],
      extra: 0,
      length: Math.hypot(points[(index + 1) % total][0] - point[0], points[(index + 1) % total][1] - point[1]),
    }))

    for (let i = 0; i < count - total; i++) {
      // Najdłuższy odcinek liczony po dodaniu już wstawionych kropek.
      let widest = 0
      for (let j = 1; j < segments.length; j++) {
        if (segments[j].length / (segments[j].extra + 1) > segments[widest].length / (segments[widest].extra + 1)) {
          widest = j
        }
      }
      segments[widest].extra++
    }

    const dots: DotPoint[] = []
    for (const segment of segments) {
      dots.push(segment.from)
      for (let i = 1; i <= segment.extra; i++) {
        const ratio = i / (segment.extra + 1)
        dots.push([
          segment.from[0] + (segment.to[0] - segment.from[0]) * ratio,
          segment.from[1] + (segment.to[1] - segment.from[1]) * ratio,
        ])
      }
    }
    return { dots }
  }

  // Skumulowana długość konturu - potrzebna do równych odstępów.
  const lengths: number[] = [0]
  for (let i = 1; i <= total; i++) {
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i % total]
    lengths.push(lengths[i - 1] + Math.hypot(bx - ax, by - ay))
  }
  const perimeter = lengths[total]

  // Punkt startowy losujemy, więc ten sam kształt w kolejnym wariancie zaczyna się gdzie indziej.
  const offset = random() * perimeter
  const dots: DotPoint[] = []

  for (let i = 0; i < count; i++) {
    const target = (offset + (perimeter * i) / count) % perimeter
    let segment = 1
    while (segment < total && lengths[segment] < target) segment++
    const segmentStart = lengths[segment - 1]
    const segmentLength = lengths[segment] - segmentStart || 1
    const ratio = (target - segmentStart) / segmentLength
    const [ax, ay] = points[segment - 1]
    const [bx, by] = points[segment % total]
    dots.push([ax + (bx - ax) * ratio, ay + (by - ay) * ratio])
  }

  return { dots }
}
