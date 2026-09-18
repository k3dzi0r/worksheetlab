// Generator szlaczków grafomotorycznych - powtarzalnych wzorów, po których dziecko wodzi
// ołówkiem, ćwicząc rękę przed nauką pisania.
//
// Każdy wzór opisany jest jako ścieżka SVG budowana z jednego, powtarzanego motywu.
// Motyw rysujemy w umownym kwadracie o boku 1, a dopiero potem skalujemy do liniatury -
// dzięki temu wszystkie szlaczki trzymają się linii niezależnie od rozmiaru.

export type PatternId =
  | 'waves'
  | 'loops'
  | 'zigzag'
  | 'arcades'
  | 'spirals'
  | 'hills'
  | 'hearts'
  | 'stars'
  | 'squares'
  | 'teeth'

export interface PatternDefinition {
  id: PatternId
  label: string
  /** Ile jednostek szerokości zajmuje jedno powtórzenie motywu. */
  width: number
  /**
   * Rysuje jedno powtórzenie motywu. `x` to lewa krawędź motywu, `top` i `bottom`
   * to górna i dolna linia szlaczka, a `unit` - wysokość między nimi.
   */
  draw: (x: number, top: number, bottom: number, unit: number) => string
}

function mid(top: number, bottom: number) {
  return (top + bottom) / 2
}

export const PATTERNS: PatternDefinition[] = [
  {
    id: 'waves',
    label: 'Fale',
    width: 2,
    draw: (x, top, bottom, unit) =>
      `Q ${x + unit * 0.5} ${top} ${x + unit} ${mid(top, bottom)} Q ${x + unit * 1.5} ${bottom} ${x + unit * 2} ${mid(top, bottom)}`,
  },
  {
    id: 'hills',
    label: 'Górki',
    width: 1,
    draw: (x, top, bottom, unit) => `Q ${x + unit * 0.5} ${top - unit * 0.35} ${x + unit} ${bottom}`,
  },
  {
    id: 'arcades',
    label: 'Arkady',
    width: 1,
    // Proste nóżki i półkole na górze - łuk o promieniu równym połowie motywu kończy się
    // dokładnie na górnej linii, więc arkada nie wychodzi poza pas szlaczka.
    draw: (x, top, bottom, unit) => {
      const radius = unit * 0.5
      return `L ${x} ${top + radius} A ${radius} ${radius} 0 0 1 ${x + unit} ${top + radius} L ${x + unit} ${bottom}`
    },
  },
  {
    id: 'loops',
    label: 'Pętelki',
    width: 1,
    // Skrzyżowane punkty kontrolne (prawy przed lewym) sprawiają, że krzywa zawija się
    // sama na siebie - powstaje prawdziwa pętelka, a nie kolejny łuk.
    draw: (x, top, bottom, unit) =>
      `C ${x + unit * 1.6} ${top} ${x - unit * 0.6} ${top} ${x + unit * 0.75} ${bottom} L ${x + unit} ${bottom}`,
  },
  {
    id: 'spirals',
    label: 'Ślimaki',
    width: 1.2,
    // Spirala Archimedesa przybliżona łamaną - łuki SVG nie potrafią zmieniać promienia,
    // a właśnie zwijanie się do środka jest tu istotą ćwiczenia.
    draw: (x, top, bottom, unit) => {
      const centerX = x + unit * 0.6
      const centerY = mid(top, bottom)
      const maxRadius = unit * 0.48
      const turns = 2.5
      const steps = 44
      const points: string[] = []
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const angle = Math.PI * 2 * turns * t
        const radius = maxRadius * (1 - t)
        points.push(
          `${(centerX + radius * Math.cos(angle)).toFixed(2)} ${(centerY + radius * Math.sin(angle)).toFixed(2)}`,
        )
      }
      return `M ${points[0]} ${points.slice(1).map((p) => `L ${p}`).join(' ')} M ${x + unit * 1.2} ${bottom}`
    },
  },
  {
    id: 'zigzag',
    label: 'Zygzaki',
    width: 1,
    draw: (x, top, bottom, unit) => `L ${x + unit * 0.5} ${top} L ${x + unit} ${bottom}`,
  },
  {
    id: 'teeth',
    label: 'Ząbki',
    width: 1,
    draw: (x, top, bottom, unit) =>
      `L ${x} ${top} L ${x + unit * 0.5} ${top} L ${x + unit * 0.5} ${bottom} L ${x + unit} ${bottom}`,
  },
  {
    id: 'squares',
    label: 'Schodki',
    width: 1.5,
    draw: (x, top, bottom, unit) =>
      `L ${x} ${top} L ${x + unit * 0.75} ${top} L ${x + unit * 0.75} ${bottom} L ${x + unit * 1.5} ${bottom}`,
  },
  {
    id: 'hearts',
    label: 'Serduszka',
    width: 1.2,
    draw: (x, top, bottom, unit) => {
      const centerY = mid(top, bottom)
      return [
        `C ${x} ${centerY - unit * 0.6} ${x + unit * 0.6} ${centerY - unit * 0.6} ${x + unit * 0.6} ${centerY}`,
        `C ${x + unit * 0.6} ${centerY - unit * 0.6} ${x + unit * 1.2} ${centerY - unit * 0.6} ${x + unit * 1.2} ${centerY}`,
        `L ${x + unit * 0.6} ${bottom}`,
        `L ${x} ${centerY}`,
        `M ${x + unit * 1.2} ${centerY}`,
      ].join(' ')
    },
  },
  {
    id: 'stars',
    label: 'Gwiazdki',
    width: 1,
    draw: (x, top, bottom, unit) => {
      const centerX = x + unit * 0.5
      const centerY = mid(top, bottom)
      const radius = unit * 0.5
      const points: string[] = []
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * i) / 5 - Math.PI / 2
        const r = i % 2 === 0 ? radius : radius * 0.42
        points.push(`${(centerX + r * Math.cos(angle)).toFixed(2)} ${(centerY + r * Math.sin(angle)).toFixed(2)}`)
      }
      return `M ${points[0]} ${points.slice(1).map((p) => `L ${p}`).join(' ')} Z M ${x + unit} ${centerY}`
    },
  },
]

export function getPattern(id: string | undefined): PatternDefinition {
  return PATTERNS.find((pattern) => pattern.id === id) ?? PATTERNS[0]
}

/**
 * Składa gotową ścieżkę jednego wiersza szlaczka: tyle powtórzeń motywu,
 * ile zmieści się między marginesami.
 */
export function buildPatternPath(
  pattern: PatternDefinition,
  startX: number,
  endX: number,
  top: number,
  bottom: number,
  unit: number,
): string {
  const step = pattern.width * unit
  const repeats = Math.max(1, Math.floor((endX - startX) / step))
  const parts: string[] = [`M ${startX} ${bottom}`]
  for (let i = 0; i < repeats; i++) {
    parts.push(pattern.draw(startX + i * step, top, bottom, unit))
  }
  return parts.join(' ')
}
