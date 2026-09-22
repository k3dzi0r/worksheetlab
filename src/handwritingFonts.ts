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
  /** Tylko do opisu/etykiety w UI - nie steruje już liniaturą (patrz equalThirds niżej). */
  style?: 'cursive' | 'print'
  /**
   * Liniatura w równych trzecich zamiast realnego x-height kroju. Ma sens tylko gdy proporcja
   * wydłużenie/x-height kroju jest bliska 2 (jak Playwrite PL, ~1,93) - inaczej litery renderowane
   * w naturalnym rozmiarze miną się z linią przerywaną (za wysoko albo, po pomniejszeniu do linii,
   * wyglądają na karłowate względem reszty wiersza). Domyślnie false: linia przerywana zostaje na
   * realnym x-height, litery zawsze naturalnej wielkości i zawsze trafiają idealnie.
   */
  equalThirds?: boolean
}

export const HANDWRITING_FONTS: HandwritingFontOption[] = [
  {
    value: '"Playwrite PL", cursive',
    label: 'Pisana (Playwrite PL)',
    description: 'Polskie pismo szkolne. Wydłużenia górne i dolne trafiają dokładnie w liniaturę.',
    // Litery łączą się wyciągnięciami wbudowanymi w glify - żadnego dodatkowego światła.
    letterSpacing: 0,
    style: 'cursive',
    equalThirds: true,
  },
  {
    value: 'Andika, sans-serif',
    label: 'Drukowana (Andika)',
    description: 'Pismo drukowane zaprojektowane do nauki czytania i pisania.',
    // Niewielkie światło ułatwia dziecku rozróżnianie liter drukowanych.
    letterSpacing: 0.1,
    style: 'print',
  },
  {
    value: 'ABeeZee, sans-serif',
    label: 'Drukowana (ABeeZee)',
    description: 'Prostsze, bardziej geometryczne litery drukowane.',
    letterSpacing: 0.1,
    style: 'print',
  },
  {
    value: 'ElementarzDwa, sans-serif',
    label: 'Pisana (Elementarz)',
    description: 'Pełny zestaw znaków, proporcje idealnie pod liniaturę w trzy linie.',
    letterSpacing: 0,
    style: 'cursive',
    // Proporcja wydłużenie/x-height 1,99 - trafia w równe trzecie bez żadnych korekt.
    equalThirds: true,
  },
]

export const DEFAULT_HANDWRITING_FONT = HANDWRITING_FONTS[0].value

/** Stare karty zapisane z Comic Sans przenosimy na domyślny krój do nauki pisania. */
const LEGACY_FONTS = new Set(['"Comic Sans MS", "Chalkboard SE", sans-serif'])

/** Usunięte z listy wyboru kroje - stare karty mapujemy na ich najbliższy odpowiednik. */
const REPLACED_FONTS: Record<string, string> = {
  'Elementarz, sans-serif': 'ElementarzDwa, sans-serif',
}

export function normalizeHandwritingFont(value: unknown): string {
  if (typeof value !== 'string' || LEGACY_FONTS.has(value)) return DEFAULT_HANDWRITING_FONT
  if (value in REPLACED_FONTS) return REPLACED_FONTS[value]
  return HANDWRITING_FONTS.some((font) => font.value === value) ? value : DEFAULT_HANDWRITING_FONT
}

export function getHandwritingFont(value: string | undefined): HandwritingFontOption {
  return HANDWRITING_FONTS.find((font) => font.value === value) ?? HANDWRITING_FONTS[0]
}
