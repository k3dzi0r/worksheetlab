// Generator kolorowanki: mandala budowana z regionów, czyli zamkniętych ścieżek SVG.
// Regiony (a nie same kreski) są tu kluczowe - dzięki nim ten sam rysunek obsługuje
// zwykłą kolorowankę, kolorowanie według kodu (numer w każdym polu) oraz klucz
// odpowiedzi (pola wypełnione właściwymi kolorami).
// Rysunek jest deterministyczny dla danego seeda, więc podgląd się nie zmienia,
// a kolejne warianty karty dostają różne, powtarzalne mandale.

import { createSeededRandom } from './utils'

export interface ColoringRegion {
  /** Ścieżka SVG zamykająca pole do pokolorowania. */
  path: string
  /** Punkt, w którym wypada numer koloru - z dala od krawędzi i od zdobień. */
  labelX: number
  labelY: number
  /** Indeks koloru z palety. Pola symetryczne dostają ten sam kolor. */
  colorIndex: number
  /** Promień największego kółka mieszczącego się w polu - do skalowania numeru. */
  room: number
}

export interface Coloring {
  size: number
  regions: ColoringRegion[]
}

export interface ColoringPalette {
  name: string
  hex: string
}

/** Paleta kredkowa: kolory, które dziecko ma w zwykłym zestawie. */
export const COLORING_PALETTE: ColoringPalette[] = [
  { name: 'czerwony', hex: '#ef4444' },
  { name: 'niebieski', hex: '#3b82f6' },
  { name: 'żółty', hex: '#facc15' },
  { name: 'zielony', hex: '#22c55e' },
  { name: 'pomarańczowy', hex: '#f97316' },
  { name: 'fioletowy', hex: '#a855f7' },
]

/** Poziomy złożoności wzoru: liczba pierścieni i pól w każdym z nich. */
export const COLORING_LEVELS = [
  { value: 1, label: 'Bardzo prosty', rings: 3, sectors: 8 },
  { value: 2, label: 'Prosty', rings: 4, sectors: 10 },
  { value: 3, label: 'Średni', rings: 5, sectors: 12 },
  { value: 4, label: 'Ozdobny', rings: 6, sectors: 16 },
  { value: 5, label: 'Bardzo ozdobny', rings: 7, sectors: 20 },
] as const

export function getColoringLevel(value: number | undefined) {
  return COLORING_LEVELS.find((level) => level.value === value) ?? COLORING_LEVELS[1]
}

export const COLOR_COUNT_MIN = 3
export const COLOR_COUNT_MAX = COLORING_PALETTE.length

/** Zamiana współrzędnych biegunowych na kartezjańskie. Kąt 0 wskazuje w górę. */
function polar(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle - Math.PI / 2),
    y: cy + radius * Math.sin(angle - Math.PI / 2),
  }
}

function point(cx: number, cy: number, radius: number, angle: number) {
  const p = polar(cx, cy, radius, angle)
  return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
}

/** Wycinek pierścienia - podstawowe pole mandali. */
function ringSectorPath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  from: number,
  to: number,
): string {
  return [
    `M ${point(cx, cy, inner, from)}`,
    `L ${point(cx, cy, outer, from)}`,
    `A ${outer.toFixed(2)} ${outer.toFixed(2)} 0 0 1 ${point(cx, cy, outer, to)}`,
    `L ${point(cx, cy, inner, to)}`,
    `A ${inner.toFixed(2)} ${inner.toFixed(2)} 0 0 0 ${point(cx, cy, inner, from)}`,
    'Z',
  ].join(' ')
}

/** Płatek: liść wpisany w wycinek pierścienia, zwrócony ostrzem na zewnątrz. */
function petalPath(cx: number, cy: number, inner: number, outer: number, from: number, to: number): string {
  const mid = (from + to) / 2
  const bulge = inner + (outer - inner) * 0.55
  return [
    `M ${point(cx, cy, inner, mid)}`,
    `Q ${point(cx, cy, bulge, from)} ${point(cx, cy, outer, mid)}`,
    `Q ${point(cx, cy, bulge, to)} ${point(cx, cy, inner, mid)}`,
    'Z',
  ].join(' ')
}

/** Romb wpisany w wycinek pierścienia. */
function diamondPath(cx: number, cy: number, inner: number, outer: number, from: number, to: number): string {
  const mid = (from + to) / 2
  const middle = (inner + outer) / 2
  return [
    `M ${point(cx, cy, inner, mid)}`,
    `L ${point(cx, cy, middle, from)}`,
    `L ${point(cx, cy, outer, mid)}`,
    `L ${point(cx, cy, middle, to)}`,
    'Z',
  ].join(' ')
}

/**
 * Ząbek wieńca: łuk wewnętrzny domknięty łagodnym wybrzuszeniem na zewnątrz.
 * Ząbki stykają się bokami, więc krawędź rysunku jest falowana, a nie poszarpana.
 * Promień punktu kontrolnego wyliczamy tak, aby szczyt krzywej trafił dokładnie w `outer`.
 */
function scallopPath(cx: number, cy: number, inner: number, outer: number, from: number, to: number): string {
  const mid = (from + to) / 2
  const control = 2 * outer - inner * Math.cos((to - from) / 2)
  return [
    `M ${point(cx, cy, inner, from)}`,
    `Q ${point(cx, cy, control, mid)} ${point(cx, cy, inner, to)}`,
    `A ${inner.toFixed(2)} ${inner.toFixed(2)} 0 0 0 ${point(cx, cy, inner, from)}`,
    'Z',
  ].join(' ')
}

function circlePath(cx: number, cy: number, radius: number) {
  return [
    `M ${(cx - radius).toFixed(2)},${cy.toFixed(2)}`,
    `a ${radius.toFixed(2)} ${radius.toFixed(2)} 0 1 0 ${(radius * 2).toFixed(2)} 0`,
    `a ${radius.toFixed(2)} ${radius.toFixed(2)} 0 1 0 ${(-radius * 2).toFixed(2)} 0`,
    'Z',
  ].join(' ')
}

/**
 * Styl pierścienia. Pierścienie „gładkie" są celowo puste i mają mniej, za to większych pól -
 * dają oddech między zdobionymi i robią z rysunku mandalę zamiast tarczy strzelniczej.
 */
type RingStyle = 'plain' | 'circle' | 'diamond' | 'petal'

/** Zdobione pierścienie przeplatamy gładkimi - stąd stały rytm wzoru. */
const RING_CYCLE: RingStyle[] = ['circle', 'plain', 'petal', 'plain', 'diamond', 'plain']

export function generateColoring(
  size: number,
  rings: number,
  sectors: number,
  seed: number,
  colorCount: number,
): Coloring {
  const random = createSeededRandom(seed)
  const center = size / 2
  // Margines, żeby gruba kreska konturu nie wyszła poza kwadrat rysunku.
  const maxRadius = size / 2 - size * 0.02
  // Wieniec płatków na zewnątrz: to on sprawia, że sylwetka jest kwiatem, a nie kołem.
  const crownThickness = maxRadius * 0.13
  const ringsOuter = maxRadius - crownThickness
  const coreRadius = maxRadius * 0.15
  const ringThickness = (ringsOuter - coreRadius) / rings
  const step = (Math.PI * 2) / sectors

  const regions: ColoringRegion[] = []
  const colors = Math.max(COLOR_COUNT_MIN, Math.min(colorCount, COLOR_COUNT_MAX))
  // Seed decyduje tylko o przesunięciu rytmu zdobień - wzór zostaje uporządkowany.
  const cycleOffset = Math.floor(random() * RING_CYCLE.length)

  // Rdzeń: koło, mniejsze koło w środku i wianuszek płatków dookoła.
  regions.push({
    path: circlePath(center, center, coreRadius),
    labelX: center,
    labelY: center - coreRadius * 0.55,
    colorIndex: 0,
    room: coreRadius * 0.3,
  })
  regions.push({
    path: circlePath(center, center, coreRadius * 0.42),
    labelX: center,
    labelY: center,
    colorIndex: 1 % colors,
    room: coreRadius * 0.42,
  })

  for (let ring = 0; ring < rings; ring++) {
    const inner = coreRadius + ring * ringThickness
    const outer = inner + ringThickness
    const style = RING_CYCLE[(ring + cycleOffset) % RING_CYCLE.length]
    // Gładkie pierścienie dostają o połowę mniej, za to większych pól - łatwiej je pokolorować.
    // Liczba pól musi być parzysta, inaczej naprzemienne kolory zderzyłyby się na styku.
    const ringSectors = style === 'plain' ? Math.max(4, 2 * Math.round(sectors / 4)) : sectors
    const ringStep = (Math.PI * 2) / ringSectors
    const baseColor = (ring + 2) % colors
    const ornamentColor = (ring + 2 + Math.max(1, Math.floor(colors / 2))) % colors

    for (let sector = 0; sector < ringSectors; sector++) {
      const from = sector * ringStep
      const to = from + ringStep
      const mid = from + ringStep / 2
      // Przy zdobionym pierścieniu numer wycinka odsuwamy na zewnątrz, żeby nie wpadł na zdobienie.
      const labelRadius = style === 'plain' ? (inner + outer) / 2 : inner + ringThickness * 0.85
      const label = polar(center, center, labelRadius, mid)
      const chord = 2 * labelRadius * Math.sin(ringStep / 2)
      // Sąsiednie pola dostają różne kolory - inaczej cały pierścień byłby jednolitą obręczą.
      const sectorColor = (baseColor + (sector % 2)) % colors

      regions.push({
        path: ringSectorPath(center, center, inner, outer, from, to),
        labelX: label.x,
        labelY: label.y,
        colorIndex: sectorColor,
        room: Math.min(ringThickness * (style === 'plain' ? 0.42 : 0.13), chord * 0.42),
      })

      if (style === 'plain') continue

      // Zdobienie musi wyraźnie pływać w środku pola, nie dotykać jego krawędzi.
      const insetFrom = from + ringStep * 0.16
      const insetTo = to - ringStep * 0.16
      const insetInner = inner + ringThickness * 0.16
      const insetOuter = outer - ringThickness * 0.16
      const ornamentCenter = polar(center, center, (inner + outer) / 2, mid)
      const ornamentRadius = Math.min(
        ringThickness * 0.3,
        ((inner + outer) / 2) * Math.sin(ringStep / 2) * 0.72,
      )

      const path =
        style === 'circle'
          ? circlePath(ornamentCenter.x, ornamentCenter.y, ornamentRadius)
          : style === 'diamond'
            ? diamondPath(center, center, insetInner, insetOuter, insetFrom, insetTo)
            : petalPath(center, center, insetInner, insetOuter, insetFrom, insetTo)

      regions.push({
        path,
        labelX: ornamentCenter.x,
        labelY: ornamentCenter.y,
        colorIndex: ornamentColor,
        room: ornamentRadius * 0.75,
      })
    }
  }

  // Wieniec: ząbki wychodzące poza ostatni pierścień, stykające się bokami.
  const crownColor = (rings + 2) % colors
  for (let sector = 0; sector < sectors; sector++) {
    const from = sector * step
    const to = from + step
    const mid = from + step / 2
    const petalCenter = polar(center, center, ringsOuter + crownThickness * 0.4, mid)
    regions.push({
      path: scallopPath(center, center, ringsOuter, maxRadius, from, to),
      labelX: petalCenter.x,
      labelY: petalCenter.y,
      colorIndex: crownColor,
      room: Math.min(crownThickness * 0.4, ringsOuter * Math.sin(step / 2) * 0.6),
    })
  }

  return { size, regions }
}
