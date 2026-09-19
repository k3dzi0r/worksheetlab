import { useMemo } from 'react'
import type { WorksheetState } from '../types/worksheet'
import { generateWordSearch, parseWords } from '../wordSearch'
import { usePageSpace } from '../usePageSpace'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface WordSearchTemplateProps {
  worksheet: WorksheetState
  seed: number
  showAnswerKey?: boolean
}

/** Najmniejsza sensowna liczba wierszy siatki. */
const MIN_ROWS = 5

export function WordSearchTemplate({ worksheet, seed, showAnswerKey = false }: WordSearchTemplateProps) {
  const {
    wordSearchWords = '',
    wordSearchGridSize = 10,
    wordSearchAllowDiagonals = false,
    wordSearchAllowReverse = false,
    wordSearchUppercase = true,
    wordSearchShape = 'square',
    wordSearchShowWords = true,
    wordSearchFiller = 'random',
    instruction,
  instructionScale = 1,
    itemScale = 1,
  } = worksheet

  const { containerRef, width, height } = usePageSpace([
    wordSearchWords,
    wordSearchGridSize,
    wordSearchShape,
    wordSearchShowWords,
    itemScale,
    instruction,
  instructionScale,
    worksheet.header,
    worksheet.orientation,
  ])

  const words = useMemo(() => parseWords(wordSearchWords), [wordSearchWords])

  // Siatka albo kwadratowa, albo dociągnięta do proporcji wolnego miejsca na kartce.
  // Lista słów stoi pod siatką, więc najpierw rezerwujemy na nią miejsce.
  const wordsHeight = wordSearchShowWords ? Math.min(140, 26 + Math.ceil(words.length / 4) * 26) : 0
  const gridHeight = Math.max(0, height - wordsHeight)
  const cols = wordSearchGridSize
  const rows =
    wordSearchShape === 'page' && width > 0 && gridHeight > 0
      ? Math.max(MIN_ROWS, Math.min(30, Math.round((cols * gridHeight) / width)))
      : cols

  const { grid, placed } = useMemo(
    () =>
      generateWordSearch(words, {
        cols,
        rows,
        allowDiagonals: wordSearchAllowDiagonals,
        allowReverse: wordSearchAllowReverse,
        filler: wordSearchFiller === 'fromWords' ? 'fromWords' : 'random',
        seed,
      }),
    [words, cols, rows, wordSearchAllowDiagonals, wordSearchAllowReverse, wordSearchFiller, seed],
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

  // Bok komórki dobieramy tak, aby cała siatka zmieściła się i w szerokość, i w wysokość.
  // 1px zapasu na zaokrąglenia przy drukowaniu.
  const cell = width > 0 && gridHeight > 0 ? Math.min((width - 1) / cols, (gridHeight - 1) / rows) : 0
  const scaledCell = wordSearchShape === 'square' ? Math.min(cell, (width * Math.min(1, 0.62 * itemScale)) / cols) : cell
  const gridWidth = scaledCell * cols

  return (
    <div className="flex flex-col w-full">
      {instruction.trim() && (
        <div className="mb-3">
          <InstructionText instruction={instruction} instructionScale={instructionScale} />
        </div>
      )}

      <div ref={containerRef} className="w-full overflow-hidden flex flex-col items-center gap-4">
        {scaledCell > 0 && (
          <div
            className="grid"
            style={{
              width: gridWidth,
              gridTemplateColumns: `repeat(${cols}, ${scaledCell}px)`,
            }}
          >
            {grid.map((gridRow, rowIndex) =>
              gridRow.map((letter, colIndex) => {
                const isSolution = solutionCells.has(`${rowIndex}:${colIndex}`)
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`flex items-center justify-center border border-gray-300 font-semibold ${
                      isSolution ? 'bg-yellow-200 text-gray-900' : 'text-gray-800'
                    }`}
                    style={{ width: scaledCell, height: scaledCell, fontSize: scaledCell * 0.55 }}
                  >
                    {wordSearchUppercase ? letter : letter.toLowerCase()}
                  </div>
                )
              }),
            )}
          </div>
        )}

        {wordSearchShowWords && placed.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-4">
            {placed.map((word) => (
              <span
                key={word.word}
                className={`text-base text-gray-800 tracking-wide`}
              >
                {wordSearchUppercase ? word.word : word.word.toLowerCase()}
              </span>
            ))}
          </div>
        )}

        {!wordSearchShowWords && placed.length > 0 && (
          <p className="text-sm text-gray-500">Ukrytych słów: {placed.length}</p>
        )}
      </div>
    </div>
  )
}
