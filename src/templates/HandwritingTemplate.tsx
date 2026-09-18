import { useEffect, useState } from 'react'
import type { WorksheetState } from '../types/worksheet'
import { DEFAULT_HANDWRITING_FONT, getHandwritingFont } from '../handwritingFonts'
import { usePageSpace } from '../usePageSpace'

interface HandwritingTemplateProps {
  worksheet: WorksheetState
}

type PartMode = 'solid' | 'tracing' | 'empty'

/** Wysokość śródlinii (x-height) w px dla itemScale = 1. Cała liniatura skaluje się od tej wartości. */
const BASE_UNIT = 22
/** Margines wewnętrzny liniatury (lewy/prawy) w px dla itemScale = 1. */
const BASE_SIDE_PADDING = 8
/** Bezpiecznik: nigdy nie rysujemy więcej wierszy, nawet gdyby liczenie miejsca zawiodło. */
const MAX_LINES = 24

function parseHandwritingText(text: string, defaultMode: PartMode) {
  const regex = /(\[z\].*?\[\/z\]|\[s\].*?\[\/s\]|\[p\].*?\[\/p\])/g
  const parts = text.split(regex)
  return parts
    .map((part) => {
      if (part.startsWith('[z]') && part.endsWith('[/z]')) return { text: part.slice(3, -4), mode: 'solid' as const }
      if (part.startsWith('[s]') && part.endsWith('[/s]')) return { text: part.slice(3, -4), mode: 'tracing' as const }
      if (part.startsWith('[p]') && part.endsWith('[/p]')) return { text: part.slice(3, -4), mode: 'empty' as const }
      return { text: part, mode: defaultMode }
    })
    .filter((p) => p.text.length > 0)
}

/** Tekst bez znaczników - potrzebny do zmierzenia rzeczywistej szerokości wiersza. */
function stripTags(text: string) {
  return text.replace(/\[\/?[zsp]\]/g, '')
}

interface LineMetrics {
  /** Szerokość wiersza zmierzona przy rozmiarze 100px (bez światła między literami). */
  width100: number
  /** Liczba znaków wiersza - światło między literami dodajemy osobno. */
  chars: number
}

interface FontMetrics {
  /** Wysokość małej litery (x-height) w przeliczeniu na 1em danego kroju. */
  xRatio: number
  /** Wysokość wydłużeń górnych (b, d, h, k, l) w przeliczeniu na 1em - tu wypada górna linia. */
  ascentRatio: number
  /** Najwyższy punkt pisma razem z diakrytykami (Ż, Ł, Ó) - zapas ponad górną linią. */
  diacriticRatio: number
  /** Głębokość wydłużeń dolnych (g, j, p, y) - tu wypada dno interlinii. */
  descentRatio: number
  /** Wymiary poszczególnych wierszy (klucz: treść wiersza wraz ze znacznikami). */
  lines: Map<string, LineMetrics>
}

/**
 * Mierzy krój pisma na canvasie. Liniatura jest potem rysowana pod konkretny krój:
 * górna linia na wysokości jego wydłużeń górnych, przerywana na x-height, a dno
 * interlinii na głębokości wydłużeń dolnych. Kroje mają bardzo różne proporcje
 * (Playwrite PL ma wydłużenie górne 1,93 x-height, Elementarz tylko 1,53), więc
 * stała liniatura pasowałaby tylko do jednego z nich.
 */
function useFontMetrics(fontFamily: string, lines: string[]): FontMetrics {
  const [metrics, setMetrics] = useState<FontMetrics>({
    xRatio: 0.52,
    ascentRatio: 0.78,
    diacriticRatio: 0.95,
    descentRatio: 0.24,
    lines: new Map(),
  })
  const linesKey = lines.join('\n')

  useEffect(() => {
    let cancelled = false

    const measure = () => {
      const ctx = document.createElement('canvas').getContext('2d')
      if (!ctx || cancelled) return
      ctx.font = `100px ${fontFamily}`

      // Do pomiaru x-height używamy liter częstych w polszczyźnie. Litery 'x' nie ma
      // w polskim alfabecie i szkolne kroje (jak Elementarz) potrafią jej w ogóle nie mieć.
      const xBox = ctx.measureText('aeomnsuc')
      const xRatio = xBox.actualBoundingBoxAscent > 0 ? xBox.actualBoundingBoxAscent / 100 : 0.52

      // Wydłużenia górne bez diakrytyków - to one mają dotykać górnej linii.
      const ascentBox = ctx.measureText('bdhklft')
      const ascentRatio = ascentBox.actualBoundingBoxAscent > 0 ? ascentBox.actualBoundingBoxAscent / 100 : 0.78

      // Polskie znaki wychodzą ponad górną linię - tak samo jak w zeszycie.
      const diacriticBox = ctx.measureText('ŻŁÓĆŃŚ')
      const diacriticRatio = Math.max(
        ascentRatio,
        diacriticBox.actualBoundingBoxAscent > 0 ? diacriticBox.actualBoundingBoxAscent / 100 : 0.95,
      )

      // Wydłużenia dolne wyznaczają dno interlinii.
      const descentBox = ctx.measureText('gjpy')
      const descentRatio = descentBox.actualBoundingBoxDescent > 0 ? descentBox.actualBoundingBoxDescent / 100 : 0.24

      const measured = new Map<string, LineMetrics>()
      for (const raw of linesKey.split('\n')) {
        const plain = stripTags(raw)
        if (!plain || measured.has(raw)) continue
        measured.set(raw, { width100: ctx.measureText(plain).width, chars: plain.length })
      }

      setMetrics({ xRatio, ascentRatio, diacriticRatio, descentRatio, lines: measured })
    }

    measure()
    // Czcionka z @font-face (Elementarz) może nie być gotowa przy pierwszym pomiarze.
    document.fonts?.ready.then(() => {
      if (!cancelled) measure()
    })

    return () => {
      cancelled = true
    }
  }, [fontFamily, linesKey])

  return metrics
}

/**
 * Kontrast śladu do obrysowania. Jasny jest ledwie widoczny - dla dziecka, które już pisze
 * samodzielnie; ciemny zostaje czytelny nawet na słabej drukarce.
 */
export const TRACE_LEVELS = [
  { value: 'light', label: 'Jasny', color: '#d8dce3' },
  { value: 'medium', label: 'Średni', color: '#c3c9d4' },
  { value: 'dark', label: 'Ciemny', color: '#9aa3b2' },
] as const

/** Co pokazuje liniatura: pełne trzy linie, samą linię podstawową albo nic. */
export const GUIDE_LEVELS = [
  { value: 'full', label: 'Pełna' },
  { value: 'baseline', label: 'Tylko podstawowa' },
  { value: 'none', label: 'Bez linii' },
] as const

function getTraceColor(value: string | undefined) {
  return (TRACE_LEVELS.find((level) => level.value === value) ?? TRACE_LEVELS[1]).color
}

export function HandwritingTemplate({ worksheet }: HandwritingTemplateProps) {
  const {
    handwritingText = '',
    handwritingMode = 'tracing',
    handwritingRepeat = false,
    handwritingFont = DEFAULT_HANDWRITING_FONT,
    handwritingTrace = 'medium',
    handwritingGuides = 'full',
    handwritingEveryOther = false,
    handwritingStartDot = false,
    itemScale = 1,
  } = worksheet

  const modeColor: Record<PartMode, string> = {
    solid: '#111827',
    tracing: getTraceColor(handwritingTrace),
    empty: 'transparent',
  }

  // Światło międzyliterowe zależy od kroju: pismo łączone musi mieć 0, inaczej pęka łączenie liter.
  const letterSpacingPerUnit = getHandwritingFont(handwritingFont).letterSpacing

  const textLines = handwritingText ? handwritingText.split('\n') : []
  const metrics = useFontMetrics(handwritingFont, handwritingRepeat ? textLines.slice(0, 1) : textLines)
  const { containerRef, width, height } = usePageSpace([
    handwritingText,
    handwritingFont,
    handwritingGuides,
    handwritingEveryOther,
    handwritingStartDot,
    itemScale,
    worksheet.header,
    worksheet.orientation,
  ])

  // Suwak rozmiaru steruje wysokością śródlinii, czyli tym, jak duże są małe litery.
  const unit = BASE_UNIT * itemScale
  const sidePadding = BASE_SIDE_PADDING * itemScale
  const usableWidth = Math.max(0, width - 2 * sidePadding)

  // Liniatura jest rysowana pod konkretny krój: górna linia dokładnie na wysokości jego
  // wydłużeń górnych, przerywana na x-height, dno interlinii na głębokości wydłużeń dolnych.
  // Dzięki temu każda czcionka - nie tylko Playwrite PL - sięga od dolnej linii do górnej.
  const fontSize = unit / metrics.xRatio
  const ascent = fontSize * metrics.ascentRatio
  const descent = fontSize * metrics.descentRatio
  // Odstęp między wierszami, żeby ogonki jednego nie dotykały wydłużeń następnego.
  const rowGap = unit * 0.4
  const rowHeight = ascent + descent + rowGap
  // Zapas nad pierwszym wierszem na polskie diakrytyki (Ó, Ż, Ł), które w zeszycie
  // też wychodzą ponad górną linię.
  const topPadding = fontSize * (metrics.diacriticRatio - metrics.ascentRatio)
  // 2px zapasu, żeby zaokrąglenia przy drukowaniu nie zepchnęły ostatniego wiersza na kolejną stronę.
  const maxRows = height > 0 ? Math.floor((height - topPadding - 2) / rowHeight) : 0
  const totalLines = Math.max(1, Math.min(MAX_LINES, maxRows || 1))

  const lines = Array.from({ length: totalLines }).map((_, i) => {
    // Z opcją „co drugi wiersz pusty" nieparzyste wiersze zostają na samodzielne pisanie.
    if (handwritingEveryOther && i % 2 === 1) return ''
    const index = handwritingEveryOther ? i / 2 : i
    if (handwritingRepeat && textLines.length > 0) return textLines[0]
    return textLines[index] || ''
  })

  const letterSpacing = unit * letterSpacingPerUnit
  const viewWidth = Math.max(width, 1)

  /**
   * Wiersz dłuższy niż szerokość kartki zmniejszamy proporcjonalnie, zamiast go uciąć.
   * Litery dalej stoją na linii podstawowej, tylko są mniejsze - nic nie wychodzi poza stronę.
   */
  function scaleForLine(line: string) {
    const measured = metrics.lines.get(line)
    if (!measured || usableWidth <= 0) return 1
    const naturalWidth = (measured.width100 / 100) * fontSize + measured.chars * letterSpacing
    if (naturalWidth <= usableWidth) return 1
    return usableWidth / naturalWidth
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ fontFamily: handwritingFont, paddingTop: topPadding }}
    >
      {lines.map((line, index) => {
        const parts = parseHandwritingText(line, handwritingMode)
        const lineScale = scaleForLine(line)
        return (
          <svg
            key={index}
            width="100%"
            height={rowHeight}
            viewBox={`0 0 ${viewWidth} ${rowHeight}`}
            preserveAspectRatio="xMinYMin meet"
            className="block"
            // Znaki diakrytyczne mogą wystawać ponad górną linię; kartki i tak pilnuje kontener.
            style={{ overflow: 'visible' }}
          >
            {/* Liniatura: linia górnych wydłużeń, przerywana linia śródlinii, czerwona linia podstawowa. */}
            {handwritingGuides === 'full' && (
              <>
                <line x1="0" y1={1} x2={viewWidth} y2={1} stroke="#60a5fa" strokeWidth="2" />
                <line
                  x1="0"
                  y1={ascent - unit}
                  x2={viewWidth}
                  y2={ascent - unit}
                  stroke="#9ca3af"
                  strokeWidth="1"
                  strokeDasharray="6 6"
                />
              </>
            )}
            {handwritingGuides !== 'none' && (
              <line x1="0" y1={ascent} x2={viewWidth} y2={ascent} stroke="#f87171" strokeWidth="2" />
            )}

            {handwritingStartDot && (
              <circle cx={sidePadding * 0.5} cy={ascent} r={Math.max(2, unit * 0.11)} fill="#16a34a" />
            )}

            {/* Tekst osadzony na linii podstawowej - dzięki temu litery realnie stoją w liniaturze. */}
            <text
              x={sidePadding}
              y={ascent}
              xmlSpace="preserve"
              dominantBaseline="alphabetic"
              fontFamily={handwritingFont}
              fontSize={fontSize * lineScale}
              letterSpacing={letterSpacing * lineScale}
            >
              {parts.map((part, partIndex) => (
                <tspan key={partIndex} fill={modeColor[part.mode]}>
                  {part.text}
                </tspan>
              ))}
            </text>
          </svg>
        )
      })}
    </div>
  )
}
