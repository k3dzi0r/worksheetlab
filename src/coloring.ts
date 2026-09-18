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
 * Styl pierścienia. „Gładkie" pierścienie są celowo puste i mają mniej, za to większych pól -
 * dają oddech między zdobionymi i robią z rysunku mandalę zamiast tarczy strzelniczej.
 */
type RingStyle = 'plain' | 'band' | 'circle' | 'diamond' | 'petal' | 'twin' | 'donut'

/** Zdobienia, które mogą trafić do pierścienia. */
const ORNAMENTS: RingStyle[] = ['circle', 'diamond', 'petal', 'twin', 'donut']
/** Pierścienie bez zdobień: z podziałem na pola albo jednolita obręcz. */
const QUIET: RingStyle[] = ['plain', 'band']

export type CrownStyle = 'auto' | 'scallop' | 'petal' | 'points' | 'none'
const CROWN_STYLES: Exclude<CrownStyle, 'auto'>[] = ['scallop', 'petal', 'points', 'none']

export interface ColoringOptions {
  size: number
  rings: number
  /** Liczba osi symetrii. 0 oznacza „dobierz losowo" w okolicach poziomu złożoności. */
  sectors: number
  crown: CrownStyle
  colorCount: number
  seed: number
  /**
   * „large" ogranicza gęstość wzoru: przy kolorowaniu według kodu w każdym polu musi
   * zmieścić się numer, więc drobne zdobienia i gęste podziały odpadają.
   */
  fields?: 'any' | 'large'
}

/**
 * Zapas na grubość konturu przy liczeniu miejsca na numer. Kreska jest rysowana po środku
 * krawędzi pola, więc bez tego zapasu numer wchodziłby na linię i stawał się nieczytelny.
 */
const OUTLINE_CLEARANCE = 9

/**
 * Promień największego kółka, jakie zmieści się w polu w danym punkcie: mniejszy z zapasu
 * wzdłuż promienia i wzdłuż łuku, pomniejszony o grubość konturu.
 */
function fieldRoom(radialHalf: number, tangentialHalf: number) {
  return Math.max(0, Math.min(radialHalf, tangentialHalf) - OUTLINE_CLEARANCE)
}

/** Kolec wieńca: trójkąt wyrastający poza ostatni pierścień. */
function pointPath(cx: number, cy: number, inner: number, outer: number, from: number, to: number): string {
  const mid = (from + to) / 2
  return [
    `M ${point(cx, cy, inner, from)}`,
    `L ${point(cx, cy, outer, mid)}`,
    `L ${point(cx, cy, inner, to)}`,
    `A ${inner.toFixed(2)} ${inner.toFixed(2)} 0 0 0 ${point(cx, cy, inner, from)}`,
    'Z',
  ].join(' ')
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]
}

export function generateColoring(options: ColoringOptions): Coloring {
  const { size, rings, crown, colorCount, seed, fields = 'any' } = options
  const largeFields = fields === 'large'
  const random = createSeededRandom(seed)
  const center = size / 2
  // Margines, żeby gruba kreska konturu nie wyszła poza kwadrat rysunku.
  const maxRadius = size / 2 - size * 0.02

  const colors = Math.max(COLOR_COUNT_MIN, Math.min(colorCount, COLOR_COUNT_MAX))

  // Liczba osi symetrii: albo wskazana przez użytkownika, albo losowana wokół poziomu złożoności.
  const drawnSectors = options.sectors > 0 ? options.sectors : 8 + 2 * Math.floor(random() * (rings + 2))
  const sectors = largeFields ? Math.min(12, drawnSectors) : drawnSectors
  const step = (Math.PI * 2) / sectors

  const crownStyle = crown === 'auto' ? pick(random, CROWN_STYLES) : crown
  // Bez wieńca cały promień zostaje dla pierścieni.
  const crownThickness = crownStyle === 'none' ? 0 : maxRadius * (0.11 + random() * 0.05)
  const ringsOuter = maxRadius - crownThickness
  const coreRadius = maxRadius * (0.12 + random() * 0.06)

  // Pierścienie o różnej grubości - równe obręcze wyglądają jak tarcza, nierówne jak mandala.
  const weights = Array.from({ length: rings }, () => 0.75 + random() * 0.6)
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)

  const regions: ColoringRegion[] = []

  // Rdzeń: koło z mniejszym kołem albo z wianuszkiem płatków w środku.
  regions.push({
    path: circlePath(center, center, coreRadius),
    labelX: center,
    labelY: center - coreRadius * 0.55,
    colorIndex: 0,
    room: fieldRoom(coreRadius * 0.28, coreRadius * 0.6),
  })
  if (random() < 0.5) {
    regions.push({
      path: circlePath(center, center, coreRadius * 0.42),
      labelX: center,
      labelY: center,
      colorIndex: 1 % colors,
      room: fieldRoom(coreRadius * 0.42, coreRadius * 0.42),
    })
  } else {
    const corePetals = sectors / 2
    const coreStep = (Math.PI * 2) / corePetals
    for (let i = 0; i < corePetals; i++) {
      const from = i * coreStep
      const petalCenter = polar(center, center, coreRadius * 0.55, from + coreStep / 2)
      regions.push({
        path: petalPath(center, center, coreRadius * 0.12, coreRadius * 0.85, from, from + coreStep),
        labelX: petalCenter.x,
        labelY: petalCenter.y,
        colorIndex: 1 % colors,
        room: fieldRoom(coreRadius * 0.2, coreRadius * 0.55 * Math.sin(coreStep / 2)),
      })
    }
  }

  let previousQuiet = false
  let previousColor = 1 % colors
  let radius = coreRadius

  for (let ring = 0; ring < rings; ring++) {
    const inner = radius
    const thickness = ((ringsOuter - coreRadius) * weights[ring]) / weightSum
    const outer = inner + thickness
    radius = outer

    // Po pierścieniu spokojnym idzie zdobiony i odwrotnie - to buduje rytm wzoru.
    // Przy kolorowaniu według kodu odpadają zdobienia, w których nie zmieściłby się numer.
    const ornaments = largeFields ? ORNAMENTS.filter((o) => o !== 'twin' && o !== 'donut') : ORNAMENTS
    const style: RingStyle = previousQuiet ? pick(random, ornaments) : pick(random, QUIET)
    previousQuiet = QUIET.includes(style)

    const isQuiet = QUIET.includes(style)
    // Przy kolorowaniu według kodu także pierścienie zdobione są rzadsze - w każdym polu
    // i w każdym zdobieniu musi zmieścić się czytelny numer.
    const denseSectors = largeFields ? Math.max(6, 2 * Math.round(sectors / 4)) : sectors
    const ringSectors = style === 'band' ? 1 : isQuiet ? Math.max(4, 2 * Math.round(sectors / 4)) : denseSectors
    const ringStep = (Math.PI * 2) / ringSectors
    // Losowy obrót pierścienia rozbija sztywną siatkę promieni.
    const phase = random() < 0.5 ? 0 : ringStep / 2
    // Kolejny pierścień nigdy nie powtarza koloru poprzedniego - inaczej cała mandala
    // wychodziła w jednej barwie i klucz odpowiedzi był monotonny.
    const baseColor = (previousColor + 1 + Math.floor(random() * (colors - 1))) % colors
    const ornamentColor = (baseColor + 1 + Math.floor(random() * (colors - 1))) % colors
    previousColor = baseColor

    if (style === 'band') {
      // Jednolita obręcz: jedno duże pole bez podziałów.
      regions.push({
        path: `${circlePath(center, center, outer)} ${circlePath(center, center, inner)}`,
        labelX: center,
        labelY: center - (inner + outer) / 2,
        colorIndex: baseColor,
        room: fieldRoom(thickness / 2, thickness),
      })
      continue
    }

    for (let sector = 0; sector < ringSectors; sector++) {
      const from = phase + sector * ringStep
      const to = from + ringStep
      const mid = from + ringStep / 2
      // Przy zdobionym pierścieniu numer wycinka odsuwamy na zewnątrz, żeby nie wpadł na zdobienie.
      // Numer stawiamy tam, gdzie w polu jest najwięcej wolnego miejsca: na środku pola,
      // a w pierścieniu zdobionym - w pasie między zdobieniem a zewnętrzną krawędzią.
      const ringMiddle = (inner + outer) / 2
      const ornamentRoom = largeFields
        ? Math.min(thickness * 0.42, ringMiddle * Math.sin(ringStep / 2) * 0.85)
        : Math.min(thickness * 0.3, ringMiddle * Math.sin(ringStep / 2) * 0.72)
      const labelInner = isQuiet ? inner : ringMiddle + ornamentRoom
      const labelRadius = (labelInner + outer) / 2
      const radialHalf = (outer - labelInner) / 2
      const label = polar(center, center, labelRadius, mid)
      // Sąsiednie pola dostają różne kolory - inaczej cały pierścień byłby jednolitą obręczą.
      const sectorColor = (baseColor + (sector % 2)) % colors

      regions.push({
        path: ringSectorPath(center, center, inner, outer, from, to),
        labelX: label.x,
        labelY: label.y,
        colorIndex: sectorColor,
        room: fieldRoom(radialHalf, labelRadius * Math.sin(ringStep / 2)),
      })

      if (isQuiet) continue

      // Zdobienie musi wyraźnie pływać w środku pola, nie dotykać jego krawędzi.
      const insetFrom = from + ringStep * 0.16
      const insetTo = to - ringStep * 0.16
      const insetInner = inner + thickness * 0.16
      const insetOuter = outer - thickness * 0.16
      const middle = (inner + outer) / 2
      const ornamentCenter = polar(center, center, middle, mid)
      const ornamentRadius = largeFields
        ? Math.min(thickness * 0.42, middle * Math.sin(ringStep / 2) * 0.85)
        : Math.min(thickness * 0.3, middle * Math.sin(ringStep / 2) * 0.72)

      if (style === 'twin') {
        // Dwa małe kółka obok siebie w jednym polu.
        for (const offset of [-0.22, 0.22]) {
          const twinCenter = polar(center, center, middle, mid + ringStep * offset)
          regions.push({
            path: circlePath(twinCenter.x, twinCenter.y, ornamentRadius * 0.55),
            labelX: twinCenter.x,
            labelY: twinCenter.y,
            colorIndex: ornamentColor,
            room: fieldRoom(ornamentRadius * 0.55, ornamentRadius * 0.55),
          })
        }
        continue
      }

      if (style === 'donut') {
        regions.push({
          path: circlePath(ornamentCenter.x, ornamentCenter.y, ornamentRadius),
          labelX: polar(center, center, middle + ornamentRadius * 0.62, mid).x,
          labelY: polar(center, center, middle + ornamentRadius * 0.62, mid).y,
          colorIndex: ornamentColor,
          room: fieldRoom(ornamentRadius * 0.27, ornamentRadius * 0.5),
        })
        regions.push({
          path: circlePath(ornamentCenter.x, ornamentCenter.y, ornamentRadius * 0.45),
          labelX: ornamentCenter.x,
          labelY: ornamentCenter.y,
          colorIndex: (ornamentColor + 1) % colors,
          room: fieldRoom(ornamentRadius * 0.45, ornamentRadius * 0.45),
        })
        continue
      }

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
        room: fieldRoom(ornamentRadius * 0.72, ornamentRadius * 0.72),
      })
    }
  }

  // Wieniec: ząbki, płatki albo kolce wychodzące poza ostatni pierścień.
  if (crownStyle !== 'none') {
    const crownColor = (rings + 2) % colors
    for (let sector = 0; sector < sectors; sector++) {
      const from = sector * step
      const to = from + step
      const mid = from + step / 2
      const crownCenter = polar(center, center, ringsOuter + crownThickness * 0.4, mid)
      const path =
        crownStyle === 'scallop'
          ? scallopPath(center, center, ringsOuter, maxRadius, from, to)
          : crownStyle === 'petal'
            ? petalPath(center, center, ringsOuter - crownThickness * 0.2, maxRadius, from, to)
            : pointPath(center, center, ringsOuter, maxRadius, from, to)
      regions.push({
        path,
        labelX: crownCenter.x,
        labelY: crownCenter.y,
        colorIndex: crownColor,
        room: fieldRoom(crownThickness * 0.45, ringsOuter * Math.sin(step / 2) * 0.7),
      })
    }
  }

  return { size, regions }
}
