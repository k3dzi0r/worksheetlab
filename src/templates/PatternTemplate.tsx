import { useMemo } from 'react'
import type { WorksheetState } from '../types/worksheet'
import { PATTERNS, buildPatternPath, getPattern } from '../patterns'
import { usePageSpace } from '../usePageSpace'
import { createSeededRandom } from '../utils'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface PatternTemplateProps {
  worksheet: WorksheetState
  seed: number
}

/** Wysokość pasa, w którym mieści się szlaczek, przy itemScale = 1. */
const BASE_UNIT = 26
/** Margines wewnętrzny wiersza w px przy itemScale = 1. */
const BASE_SIDE_PADDING = 10
const MAX_ROWS = 20

/** Ile wiersza zajmuje gotowy wzór, a ile ślad do obrysowania. */
export const PATTERN_HELP_LEVELS = [
  { value: 'high', label: 'Dużo', solid: 0.3, trace: 0.7 },
  { value: 'medium', label: 'Średnio', solid: 0.2, trace: 0.5 },
  { value: 'low', label: 'Mało', solid: 0.15, trace: 0.3 },
  { value: 'none', label: 'Sam wzór', solid: 0.12, trace: 0.12 },
] as const

export type PatternHelp = (typeof PATTERN_HELP_LEVELS)[number]['value']

export const PATTERN_LENGTH_MIN = 15
export const PATTERN_LENGTH_MAX = 100

function getHelpLevel(value: string | undefined) {
  return PATTERN_HELP_LEVELS.find((level) => level.value === value) ?? PATTERN_HELP_LEVELS[1]
}

export function PatternTemplate({ worksheet, seed }: PatternTemplateProps) {
  const {
    patternId = 'waves',
    patternHelp = 'medium',
    patternLength,
    patternGuides = true,
    patternStartDot = true,
    instruction,
  instructionScale = 1,
    itemScale = 1,
  } = worksheet

  const { containerRef, width, height } = usePageSpace([
    patternId,
    patternHelp,
    patternLength,
    patternGuides,
    patternStartDot,
    itemScale,
    instruction,
  instructionScale,
    worksheet.header,
    worksheet.orientation,
  ])

  const unit = BASE_UNIT * itemScale
  const sidePadding = BASE_SIDE_PADDING * itemScale
  // Wiersz: pas szlaczka plus odstęp, żeby wzory sąsiednich wierszy się nie stykały.
  const rowGap = unit * 0.85
  const rowHeight = unit + rowGap
  // 2px zapasu, żeby zaokrąglenia przy drukowaniu nie zepchnęły ostatniego wiersza na kolejną stronę.
  const rows = height > 0 ? Math.max(1, Math.min(MAX_ROWS, Math.floor((height - 2) / rowHeight))) : 1

  // „mixed" daje w każdym wierszu inny wzór, a seed sprawia, że każdy wariant karty jest inny.
  const rowPatterns = useMemo(() => {
    if (patternId !== 'mixed') return Array.from({ length: rows }, () => getPattern(patternId))
    // Tasujemy listę wzorów i idziemy po niej po kolei: dopóki starcza wzorów, żaden się nie
    // powtórzy, a seed sprawia, że każdy wariant karty dostaje inną kolejność.
    const random = createSeededRandom(seed)
    const shuffled = [...PATTERNS]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return Array.from({ length: rows }, (_, index) => shuffled[index % shuffled.length])
  }, [patternId, rows, seed])

  const help = getHelpLevel(patternHelp)
  // Starsze projekty nie mają suwaka długości, więc zachowują dawny poziom podpowiedzi.
  const lengthRatio = Math.min(
    PATTERN_LENGTH_MAX,
    Math.max(PATTERN_LENGTH_MIN, patternLength ?? help.trace * 100),
  ) / 100
  const viewWidth = Math.max(width, 1)
  const startX = sidePadding
  const endX = viewWidth - sidePadding
  const solidEnd = startX + (endX - startX) * Math.min(help.solid, lengthRatio)
  const traceEnd = startX + (endX - startX) * lengthRatio
  const stroke = Math.max(1.6, unit * 0.09)

  return (
    <div className="flex flex-col w-full">
      {instruction.trim() && (
        <div className="mb-3">
          <InstructionText instruction={instruction} instructionScale={instructionScale} />
        </div>
      )}

      <div ref={containerRef} className="w-full overflow-hidden">
        {rowPatterns.map((pattern, index) => {
          const top = rowGap / 2
          const bottom = top + unit
          const path = buildPatternPath(pattern, startX, endX, top, bottom, unit)
          const clipId = `pattern-clip-${index}`

          return (
            <svg
              key={index}
              width="100%"
              height={rowHeight}
              viewBox={`0 0 ${viewWidth} ${rowHeight}`}
              preserveAspectRatio="xMinYMin meet"
              className="block"
            >
              <defs>
                {/* Ten sam wzór rysujemy trzy razy, każdy raz przycięty do innego fragmentu
                    wiersza: najpierw gotowy, potem po śladzie, a dalej dziecko rysuje samo. */}
                <clipPath id={`${clipId}-solid`}>
                  <rect x="0" y="0" width={solidEnd} height={rowHeight} />
                </clipPath>
                <clipPath id={`${clipId}-trace`}>
                  <rect x={solidEnd} y="0" width={Math.max(0, traceEnd - solidEnd)} height={rowHeight} />
                </clipPath>
              </defs>

              {patternGuides && (
                <>
                  <line x1="0" y1={top} x2={viewWidth} y2={top} stroke="#bfdbfe" strokeWidth="1.5" />
                  <line x1="0" y1={bottom} x2={viewWidth} y2={bottom} stroke="#bfdbfe" strokeWidth="1.5" />
                </>
              )}

              <path
                d={path}
                fill="none"
                stroke="#111827"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath={`url(#${clipId}-solid)`}
              />
              <path
                d={path}
                fill="none"
                stroke="#b9c0cc"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${stroke * 1.6} ${stroke * 1.8}`}
                clipPath={`url(#${clipId}-trace)`}
              />

              {patternStartDot && (
                <circle cx={startX} cy={bottom} r={stroke * 1.4} fill="#16a34a" />
              )}
            </svg>
          )
        })}
      </div>
    </div>
  )
}
