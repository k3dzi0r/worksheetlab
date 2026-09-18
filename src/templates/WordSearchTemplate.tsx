import { useMemo } from 'react'
import type { WorksheetState } from '../types/worksheet'
import { generateWordSearch, parseWords } from '../wordSearch'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface WordSearchTemplateProps {
  worksheet: WorksheetState
  seed: number
  showAnswerKey?: boolean
}

export function WordSearchTemplate({ worksheet, seed, showAnswerKey = false }: WordSearchTemplateProps) {
  const {
    wordSearchWords = '',
    wordSearchGridSize = 10,
    wordSearchAllowDiagonals = false,
    wordSearchAllowReverse = false,
    wordSearchUppercase = true,
    itemScale = 1,
    simpleMode = false,
  } = worksheet

  const words = useMemo(() => parseWords(wordSearchWords), [wordSearchWords])
  const { grid, placed } = useMemo(
    () =>
      generateWordSearch(words, {
        size: wordSearchGridSize,
        allowDiagonals: wordSearchAllowDiagonals,
        allowReverse: wordSearchAllowReverse,
        seed,
      }),
    [words, wordSearchGridSize, wordSearchAllowDiagonals, wordSearchAllowReverse, seed],
  )

  // Komórki należące do ukrytych słów - podświetlamy je tylko w kluczu odpowiedzi.
  const solutionCells = useMemo(() => {
    const set = new Set<string>()
    if (!showAnswerKey) return set
    for (const word of placed) {
      for (const cell of word.cells) set.add(`${cell.row}:${cell.col}`)
    }
    return set
  }, [placed, showAnswerKey])

  // Siatka zawsze mieści się w szerokości kartki: rozmiar komórki liczymy w procentach,
  // a cały blok ograniczamy suwakiem rozmiaru elementów.
  const gridMaxWidth = `${Math.min(100, 62 * itemScale)}%`

  return (
    <div className="flex flex-col gap-6 w-full">
      <InstructionText instruction={worksheet.instruction} simpleMode={simpleMode} />

      <div className="w-full flex justify-center">
        <div
          className="grid w-full"
          style={{
            maxWidth: gridMaxWidth,
            gridTemplateColumns: `repeat(${wordSearchGridSize}, minmax(0, 1fr))`,
            // Litery skalują się wraz z siatką (jednostka cqw = 1% szerokości siatki),
            // więc nigdy nie wychodzą poza komórki ani poza kartkę.
            containerType: 'inline-size',
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((letter, colIndex) => {
              const isSolution = solutionCells.has(`${rowIndex}:${colIndex}`)
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`aspect-square flex items-center justify-center border border-gray-300 font-semibold ${
                    isSolution ? 'bg-yellow-200 text-gray-900' : 'text-gray-800'
                  }`}
                  style={{ fontSize: `${(100 / wordSearchGridSize) * 0.55}cqw` }}
                >
                  {wordSearchUppercase ? letter : letter.toLowerCase()}
                </div>
              )
            }),
          )}
        </div>
      </div>

      {placed.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-4">
          {placed.map((word) => (
            <span
              key={word.word}
              className={`${simpleMode ? 'text-xl' : 'text-base'} text-gray-800 tracking-wide`}
            >
              {wordSearchUppercase ? word.word : word.word.toLowerCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
