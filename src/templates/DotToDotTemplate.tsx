import { useMemo } from 'react'
import type { WorksheetState } from '../types/worksheet'
import { DOT_SHAPES, buildDotToDot, dotLabel, getDotShape } from '../dotToDot'
import type { DotNumbering } from '../dotToDot'
import { usePageSpace } from '../usePageSpace'
import { createSeededRandom } from '../utils'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface DotToDotTemplateProps {
  worksheet: WorksheetState
  seed: number
  showAnswerKey?: boolean
}

/** Dłuższy bok rysunku w umownym układzie współrzędnych; na kartkę skalujemy przez viewBox. */
const CANVAS = 1000
/** Zapas wokół konturu na numery, które wychodzą poza rysunek. */
const PADDING = 95

export function DotToDotTemplate({ worksheet, seed, showAnswerKey = false }: DotToDotTemplateProps) {
  const {
    dotShape = 'star',
    dotCount = 20,
    dotNumbering = 'numbers',
    dotShowOutline = false,
    instruction,
    simpleMode = false,
  } = worksheet

  const { containerRef, width, height } = usePageSpace([
    dotShape,
    dotCount,
    dotNumbering,
    dotShowOutline,
    instruction,
    worksheet.header,
    worksheet.orientation,
    simpleMode,
  ])

  const shape = useMemo(() => {
    if (dotShape !== 'random') return getDotShape(dotShape)
    // Przy „losowo" każdy wariant karty dostaje inny obrazek.
    const random = createSeededRandom(seed)
    return DOT_SHAPES[Math.floor(random() * DOT_SHAPES.length)]
  }, [dotShape, seed])

  const { dots } = useMemo(
    () => buildDotToDot({ shape, count: dotCount, seed }),
    [shape, dotCount, seed],
  )

  // Środek konturu - względem niego wybieramy, w którą stronę odsunąć numer.
  const center = useMemo(() => {
    const sum = dots.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0])
    return [sum[0] / (dots.length || 1), sum[1] / (dots.length || 1)]
  }, [dots])

  // Płótno ma proporcje samego obrazka, więc rybka zajmuje szerokość, a rakieta wysokość.
  const bounds = useMemo(() => {
    const xs = dots.map(([x]) => x)
    const ys = dots.map(([, y]) => y)
    return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
  }, [dots])

  const canvasWidth = CANVAS * (bounds.maxX - bounds.minX) + 2 * PADDING
  const canvasHeight = CANVAS * (bounds.maxY - bounds.minY) + 2 * PADDING

  const toCanvas = ([x, y]: [number, number]): [number, number] => [
    PADDING + (x - bounds.minX) * CANVAS,
    PADDING + (y - bounds.minY) * CANVAS,
  ]

  // 1px zapasu na zaokrąglenia przy drukowaniu.
  const fit = Math.min((width - 1) / canvasWidth, (height - 1) / canvasHeight)
  const drawWidth = Math.max(0, canvasWidth * fit)
  const drawHeight = Math.max(0, canvasHeight * fit)

  const dotRadius = Math.max(4, Math.min(12, 260 / dotCount))
  const fontSize = Math.max(14, Math.min(34, 620 / dotCount))
  const points = dots.map(toCanvas)

  return (
    <div className="flex flex-col w-full">
      {instruction.trim() && (
        <div className="mb-3">
          <InstructionText instruction={instruction} simpleMode={simpleMode} />
        </div>
      )}

      {/* Kwadratowy rysunek nigdy nie wypełni prostokątnej kartki, więc centrujemy go
          w pozostałym miejscu zamiast zostawiać pustkę pod spodem. */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden flex items-center justify-center"
        style={{ height: height || undefined }}
      >
        {drawWidth > 0 && (
          <svg
            width={drawWidth}
            height={drawHeight}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            className="block"
          >
            {/* Podpowiedź dla najmłodszych: blady kontur, po którym widać, co powstanie. */}
            {dotShowOutline && !showAnswerKey && (
              <polygon
                points={points.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
                strokeDasharray="10 10"
              />
            )}

            {showAnswerKey && (
              <polygon
                points={points.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="#f97316"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            )}

            {points.map(([x, y], index) => {
              // Numer odsuwamy prostopadle do konturu, a nie od środka rysunku: kropki leżące
              // blisko środka (wcięcie ogona rybki, talia motyla) dostawały wtedy numer w środku
              // obrazka. Zwrot normalnej wybieramy ten, który prowadzi na zewnątrz.
              const [px, py] = points[(index - 1 + points.length) % points.length]
              const [nx, ny] = points[(index + 1) % points.length]
              const tangentX = nx - px
              const tangentY = ny - py
              const tangentLength = Math.hypot(tangentX, tangentY) || 1
              let normalX = tangentY / tangentLength
              let normalY = -tangentX / tangentLength

              const [cx, cy] = toCanvas(center as [number, number])
              if (normalX * (x - cx) + normalY * (y - cy) < 0) {
                normalX = -normalX
                normalY = -normalY
              }

              const push = dotRadius + fontSize * 0.75
              return (
                <g key={index}>
                  <circle cx={x} cy={y} r={dotRadius} fill="#111827" />
                  <text
                    x={x + normalX * push}
                    y={y + normalY * push}
                    fontSize={fontSize}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#1f2937"
                    fontFamily="Andika, sans-serif"
                  >
                    {dotLabel(index, dots.length, dotNumbering as DotNumbering)}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>
    </div>
  )
}
