// Kroje pisma dostępne w szablonie „Nauka pisania”.
// Uwaga na proporcje: liniatura zakłada, że wydłużenie górne jest dwa razy wyższe od śródlinii.
// Playwrite PL ma dokładnie taką proporcję (1,93), więc litery trafiają w linie idealnie.
// Kroje drukowane mają ok. 1,57 - ich wysokie litery nie dotykają górnej linii i tak ma być.
// Każdy krój ma własne światło międzyliterowe: pismo łączone (Elementarz) musi mieć 0,
// bo dodatkowy odstęp rozrywa połączenia między literami.

export interface HandwritingFontOption {
  /** Wartość CSS `font-family`. */
  value: string
  label: string
  description: string
  /** Światło między literami wyrażone w jednostkach śródlinii. 0 = litery się łączą. */
  letterSpacing: number
  /** Korekta optyczna położenia pisma względem linii podstawowej, w jednostkach śródlinii. */
  baselineOffset?: number
}

export const HANDWRITING_FONTS: HandwritingFontOption[] = [
  {
    value: '"Playwrite PL", cursive',
    label: 'Pisana (Playwrite PL)',
    description: 'Polskie pismo szkolne. Wydłużenia górne i dolne trafiają dokładnie w liniaturę.',
    // Litery łączą się wyciągnięciami wbudowanymi w glify - żadnego dodatkowego światła.
    letterSpacing: 0,
  },
  {
    value: 'Andika, sans-serif',
    label: 'Drukowana (Andika)',
    description: 'Pismo drukowane zaprojektowane do nauki czytania i pisania.',
    // Niewielkie światło ułatwia dziecku rozróżnianie liter drukowanych.
    letterSpacing: 0.1,
  },
  {
    value: 'ABeeZee, sans-serif',
    label: 'Drukowana (ABeeZee)',
    description: 'Prostsze, bardziej geometryczne litery drukowane.',
    letterSpacing: 0.1,
  },
  {
    value: 'Elementarz, sans-serif',
    label: 'Pisana (Elementarz)',
    description: 'Starszy, cieńszy krój pisma szkolnego - zostawiony dla kart zrobionych wcześniej.',
    letterSpacing: 0,
    // Krój ma dodatkowy oddech wewnątrz glifu, przez który wizualnie unosi się nad czerwoną linią.
    baselineOffset: 0.14,
  },
]

export const DEFAULT_HANDWRITING_FONT = HANDWRITING_FONTS[0].value

/** Stare karty zapisane z Comic Sans przenosimy na domyślny krój do nauki pisania. */
const LEGACY_FONTS = new Set(['"Comic Sans MS", "Chalkboard SE", sans-serif'])

export function normalizeHandwritingFont(value: unknown): string {
  if (typeof value !== 'string' || LEGACY_FONTS.has(value)) return DEFAULT_HANDWRITING_FONT
  return HANDWRITING_FONTS.some((font) => font.value === value) ? value : DEFAULT_HANDWRITING_FONT
}

export function getHandwritingFont(value: string | undefined): HandwritingFontOption {
  return HANDWRITING_FONTS.find((font) => font.value === value) ?? HANDWRITING_FONTS[0]
}
