import { useMemo } from 'react'
import type { WorksheetItem, WorksheetState } from '../types/worksheet'
import { generateMaze, getMazeLevel } from '../maze'
import { usePageSpace } from '../usePageSpace'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface MazeTemplateProps {
  worksheet: WorksheetState
  items: WorksheetItem[]
  seed: number
  showAnswerKey?: boolean
}

/** Grubość ścian w stosunku do wielkości pola - żeby labirynt był czytelny na wydruku. */
const WALL_RATIO = 0.12
const MIN_ROWS = 4

export function MazeTemplate({ worksheet, items, seed, showAnswerKey = false }: MazeTemplateProps) {
  const { mazeLevel, simpleMode = false, instruction } = worksheet
  const level = getMazeLevel(mazeLevel)

  const { containerRef, width, height } = usePageSpace([
    mazeLevel,
    worksheet.header,
    worksheet.orientation,
    instruction,
    simpleMode,
  ])

  // Liczbę wierszy dobieramy do proporcji wolnego miejsca, żeby pola były kwadratowe,
  // a labirynt wypełniał kartkę zarówno w pionie, jak i w poziomie.
  const rows = width > 0 && height > 0 ? Math.max(MIN_ROWS, Math.round((level.cols * height) / width)) : MIN_ROWS

  const maze = useMemo(() => generateMaze(level.cols, rows, seed), [level.cols, rows, seed])

  // Ramka rysowana jest po środku linii, więc jej grubość zjada część kartki - liczymy ją
  // w dopasowaniu, inaczej labirynt wystawałby poza dolną krawędź zadruku.
  // 1px zapasu na zaokrąglenia przy drukowaniu.
  const fitWidth = Math.max(0, width - 1)
  const fitHeight = Math.max(0, height - 1)
  const roughCell = width > 0 ? Math.min(fitWidth / (maze.cols + WALL_RATIO), fitHeight / (maze.rows + WALL_RATIO)) : 0
  const wall = Math.max(1.5, roughCell * WALL_RATIO)
  const cell = width > 0 ? Math.min((fitWidth - wall) / maze.cols, (fitHeight - wall) / maze.rows) : 0
  // Ramka labiryntu rysowana jest po środku linii, więc do rozmiaru dokładamy jej grubość.
  const mazeWidth = maze.cols * cell + wall
  const mazeHeight = maze.rows * cell + wall
  const offset = wall / 2

  const start = items[0]
  const finish = items[1]

  const solutionPoints = maze.solution
    .map(({ col, row }) => `${offset + (col + 0.5) * cell},${offset + (row + 0.5) * cell}`)
    .join(' ')

  return (
    <div className="flex flex-col w-full">
      {instruction.trim() && (
        <div className="mb-4">
          <InstructionText instruction={instruction} simpleMode={simpleMode} />
        </div>
      )}

      <div ref={containerRef} className="w-full overflow-hidden flex justify-center">
        {cell > 0 && (
          <svg width={mazeWidth} height={mazeHeight} viewBox={`0 0 ${mazeWidth} ${mazeHeight}`} className="block">
            {/* Ściany: rysujemy górną i lewą każdego pola oraz domykamy prawą i dolną krawędź siatki,
                dzięki czemu każda ściana powstaje dokładnie raz. */}
            <g stroke="#1f2937" strokeWidth={wall} strokeLinecap="square">
              {maze.cells.map((rowCells, row) =>
                rowCells.map((mazeCell, col) => {
                  const x = offset + col * cell
                  const y = offset + row * cell
                  // Wejście w lewej ścianie pierwszego pola, wyjście w prawej ścianie ostatniego.
                  const isEntrance = col === 0 && row === 0
                  const isExit = col === maze.cols - 1 && row === maze.rows - 1
                  return (
                    <g key={`${row}-${col}`}>
                      {mazeCell.walls[0] && <line x1={x} y1={y} x2={x + cell} y2={y} />}
                      {mazeCell.walls[3] && !isEntrance && <line x1={x} y1={y} x2={x} y2={y + cell} />}
                      {col === maze.cols - 1 && !isExit && (
                        <line x1={x + cell} y1={y} x2={x + cell} y2={y + cell} />
                      )}
                      {row === maze.rows - 1 && <line x1={x} y1={y + cell} x2={x + cell} y2={y + cell} />}
                    </g>
                  )
                }),
              )}
            </g>

            {/* Klucz odpowiedzi: przejście od startu do mety. */}
            {showAnswerKey && (
              <polyline
                points={solutionPoints}
                fill="none"
                stroke="#f97316"
                strokeWidth={Math.max(2, cell * 0.2)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
            )}

            <MazeMarker item={start} cell={cell} x={offset} y={offset} fallback="START" />
            <MazeMarker
              item={finish}
              cell={cell}
              x={offset + (maze.cols - 1) * cell}
              y={offset + (maze.rows - 1) * cell}
              fallback="META"
            />
          </svg>
        )}
      </div>
    </div>
  )
}

interface MazeMarkerProps {
  item: WorksheetItem | undefined
  cell: number
  x: number
  y: number
  fallback: string
}

/** Znacznik startu/mety: element dodany przez użytkownika, a gdy go brak - podpis tekstowy. */
function MazeMarker({ item, cell, x, y, fallback }: MazeMarkerProps) {
  const padding = cell * 0.15
  const size = cell - 2 * padding

  if (item?.source === 'image' && item.imageDataUrl) {
    return <image href={item.imageDataUrl} x={x + padding} y={y + padding} width={size} height={size} />
  }

  if (item?.source === 'emoji' && item.emoji) {
    return (
      <text
        x={x + cell / 2}
        y={y + cell / 2}
        fontSize={size}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {item.emoji}
      </text>
    )
  }

  return (
    <text
      x={x + cell / 2}
      y={y + cell / 2}
      fontSize={Math.min(cell * 0.32, 14)}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#2563eb"
      fontWeight="bold"
    >
      {fallback}
    </text>
  )
}
