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
  /** Najwyższy punkt pisma (wydłużenia górne z diakrytykami) w przeliczeniu na 1em. */
  ascentRatio: number
  /** Wymiary poszczególnych wierszy (klucz: treść wiersza wraz ze znacznikami). */
  lines: Map<string, LineMetrics>
}

/**
 * Mierzy krój pisma na canvasie, żeby litery realnie siadały w liniaturze:
 * rozmiar czcionki dobieramy tak, aby x-height dokładnie wypełnił śródlinię.
 */
function useFontMetrics(fontFamily: string, lines: string[]): FontMetrics {
  const [metrics, setMetrics] = useState<FontMetrics>({ xRatio: 0.52, ascentRatio: 0.95, lines: new Map() })
  const linesKey = lines.join('\n')

  useEffect(() => {
    let cancelled = false

    const measure = () => {
      const ctx = document.createElement('canvas').getContext('2d')
      if (!ctx || cancelled) return
      ctx.font = `100px ${fontFamily}`

      const xBox = ctx.measureText('x')
      const xRatio = xBox.actualBoundingBoxAscent > 0 ? xBox.actualBoundingBoxAscent / 100 : 0.52

      // Litery z najwyższymi wydłużeniami i polskimi znakami - wyznaczają zapas nad pierwszym wierszem.
      const ascentBox = ctx.measureText('ŻŁÓbdhklft')
      const ascentRatio = ascentBox.actualBoundingBoxAscent > 0 ? ascentBox.actualBoundingBoxAscent / 100 : 0.95

      const measured = new Map<string, LineMetrics>()
      for (const raw of linesKey.split('\n')) {
        const plain = stripTags(raw)
        if (!plain || measured.has(raw)) continue
        measured.set(raw, { width100: ctx.measureText(plain).width, chars: plain.length })
      }

      setMetrics({ xRatio, ascentRatio, lines: measured })
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

const MODE_COLOR: Record<PartMode, string> = {
  solid: '#111827',
  // Ślad musi być widoczny na wydruku, ale na tyle jasny, żeby dziecko pisało po nim.
  tracing: '#c3c9d4',
  empty: 'transparent',
}

export function HandwritingTemplate({ worksheet }: HandwritingTemplateProps) {
  const {
    handwritingText = '',
    handwritingMode = 'tracing',
    handwritingRepeat = false,
    handwritingFont = DEFAULT_HANDWRITING_FONT,
    itemScale = 1,
  } = worksheet

  // Światło międzyliterowe zależy od kroju: pismo łączone musi mieć 0, inaczej pęka łączenie liter.
  const letterSpacingPerUnit = getHandwritingFont(handwritingFont).letterSpacing

  const textLines = handwritingText ? handwritingText.split('\n') : []
  const metrics = useFontMetrics(handwritingFont, handwritingRepeat ? textLines.slice(0, 1) : textLines)
  const { containerRef, width, height } = usePageSpace([
    handwritingText,
    handwritingFont,
    itemScale,
    worksheet.header,
    worksheet.orientation,
  ])

  // Śródlinia (odległość linii przerywanej od podstawowej) wyznacza rozmiar całej liniatury.
  // Liniatura zależy wyłącznie od suwaka rozmiaru, więc wszystkie wiersze są identyczne.
  const unit = BASE_UNIT * itemScale
  const sidePadding = BASE_SIDE_PADDING * itemScale
  const usableWidth = Math.max(0, width - 2 * sidePadding)

  // Wiersz = strefa górnych wydłużeń + śródlinia + strefa dolnych wydłużeń (interlinia).
  const rowHeight = unit * 3
  // Zapas nad pierwszym wierszem: wydłużenia górne i polskie diakrytyki (Ó, Ż, Ł) wychodzą
  // ponad górną linię - tak samo jak w zeszycie. Wysokość liczymy z metryk konkretnego kroju,
  // bo pisane (Playwrite PL) sięga znacznie wyżej niż drukowane.
  const ascentAboveTopLine = unit * (metrics.ascentRatio / metrics.xRatio - 2)
  const topPadding = Math.max(unit * 0.25, ascentAboveTopLine)
  // 2px zapasu, żeby zaokrąglenia przy drukowaniu nie zepchnęły ostatniego wiersza na kolejną stronę.
  const maxRows = height > 0 ? Math.floor((height - topPadding - 2) / rowHeight) : 0
  const totalLines = Math.max(1, Math.min(MAX_LINES, maxRows || 1))

  const lines = Array.from({ length: totalLines }).map((_, i) => {
    if (handwritingRepeat && textLines.length > 0) return textLines[0]
    return textLines[i] || ''
  })

  const fontSize = unit / metrics.xRatio
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
            <line x1="0" y1="1" x2={viewWidth} y2="1" stroke="#60a5fa" strokeWidth="2" />
            <line
              x1="0"
              y1={unit}
              x2={viewWidth}
              y2={unit}
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
            <line x1="0" y1={unit * 2} x2={viewWidth} y2={unit * 2} stroke="#f87171" strokeWidth="2" />

            {/* Tekst osadzony na linii podstawowej - dzięki temu litery realnie stoją w liniaturze. */}
            <text
              x={sidePadding}
              y={unit * 2}
              xmlSpace="preserve"
              dominantBaseline="alphabetic"
              fontFamily={handwritingFont}
              fontSize={fontSize * lineScale}
              letterSpacing={letterSpacing * lineScale}
            >
              {parts.map((part, partIndex) => (
                <tspan key={partIndex} fill={MODE_COLOR[part.mode]}>
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
