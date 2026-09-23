import { useMemo } from 'react'
import type { WorksheetState } from '../types/worksheet'
import { buildCrossword, parseCrosswordLines } from '../crossword'
import { usePageSpace } from '../usePageSpace'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface CrosswordTemplateProps {
  worksheet: WorksheetState
  seed: number
  showAnswerKey?: boolean
}

/** Największy sensowny bok kratki - większe pola wyglądają jak plansza, nie jak krzyżówka. */
const MAX_CELL = 46
/** Definicje czyta dziecko - 15 px było za drobne na wydruku. */
const CLUE_FONT = 18
const CLUE_LINE = Math.round(CLUE_FONT * 1.45) + 4
/** Kratki na hasło pod krzyżówką - trochę mniejsze niż w siatce, żeby nie konkurowały z nią. */
const KEYWORD_BOX = 34

export function CrosswordTemplate({ worksheet, seed, showAnswerKey = false }: CrosswordTemplateProps) {
  const {
    crosswordWords = '',
    crosswordKeyword = '',
    crosswordShowClues = true,
    crosswordNumbers = true,
    instruction,
  instructionScale = 1,
    itemScale = 1,
  } = worksheet

  const { containerRef, width, height } = usePageSpace([
    crosswordWords,
    crosswordKeyword,
    crosswordShowClues,
    crosswordNumbers,
    itemScale,
    instruction,
  instructionScale,
    worksheet.header,
    worksheet.orientation,
  ])

  const crossword = useMemo(
    () => buildCrossword(parseCrosswordLines(crosswordWords), { keyword: crosswordKeyword, seed }),
    [crosswordWords, crosswordKeyword, seed],
  )

  const { entries, keyColumn, cols } = crossword
  const clues = entries.filter((entry) => entry.clue.length > 0)
  // Przy haśle podanym przez nauczyciela uczeń wpisuje je jeszcze raz w osobne kratki -
  // przy losowych literach nie ma czego odczytywać.
  const showKeywordRow = crosswordKeyword.trim().length > 0 && crossword.keyword.length > 0
  // Definicje i hasło stoją pod krzyżówką, więc najpierw rezerwujemy na nie miejsce.
  const cluesHeight = crosswordShowClues && clues.length > 0 ? 24 + clues.length * CLUE_LINE : 0
  const keywordHeight = showKeywordRow ? KEYWORD_BOX + 24 : 0
  const gridHeight = Math.max(0, height - cluesHeight - keywordHeight)

  // Kratka musi zmieścić się i w szerokość, i w wysokość; numery zajmują dodatkową kolumnę.
  const numberWidth = crosswordNumbers ? 1 : 0
  const cell =
    entries.length > 0 && width > 0 && gridHeight > 0
      ? Math.min(MAX_CELL * itemScale, (width - 1) / (cols + numberWidth), (gridHeight - 1) / entries.length)
      : 0
  const gridWidth = cell * (cols + numberWidth)

  if (entries.length === 0) {
    return (
      <div className="flex flex-col w-full">
        <InstructionText instruction={instruction} instructionScale={instructionScale} />
        <div ref={containerRef} className="w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      {instruction.trim() && (
        <div className="mb-3">
          <InstructionText instruction={instruction} instructionScale={instructionScale} />
        </div>
      )}

      {/* Krzyżówka rzadko wypełnia kartkę w pionie, więc zamiast zostawiać pustkę pod spodem
          środkujemy ją w wolnym miejscu. */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden flex flex-col items-center justify-center gap-4"
        style={{ height: height || undefined }}
      >
        <div style={{ width: gridWidth }}>
          {entries.map((entry, index) => (
            <div key={index} className="flex" style={{ height: cell }}>
              {crosswordNumbers && (
                <div
                  className="flex items-center justify-end pr-1 text-gray-500 tabular-nums"
                  style={{ width: cell, fontSize: cell * 0.4 }}
                >
                  {index + 1}.
                </div>
              )}
              {Array.from({ length: cols }).map((_, col) => {
                const letterIndex = col - entry.startCol
                const inWord = letterIndex >= 0 && letterIndex < entry.word.length
                const isKey = col === keyColumn
                if (!inWord) return <div key={col} style={{ width: cell, height: cell }} />
                return (
                  <div
                    key={col}
                    className={`flex items-center justify-center border border-gray-700 font-semibold ${
                      isKey ? 'bg-yellow-100 border-2 border-gray-900' : ''
                    } ${showAnswerKey ? 'text-blue-700' : 'text-transparent'}`}
                    style={{ width: cell, height: cell, fontSize: cell * 0.55 }}
                  >
                    {entry.word[letterIndex]}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {showKeywordRow && (
          <div className="flex items-center gap-3" aria-label="Hasło">
            <span className="font-semibold text-gray-800" style={{ fontSize: CLUE_FONT }}>
              Hasło:
            </span>
            <div className="flex">
              {[...crossword.keyword].map((letter, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-center border-2 border-gray-900 bg-yellow-100 font-semibold ${
                    index > 0 ? '-ml-0.5' : ''
                  } ${showAnswerKey ? 'text-blue-700' : 'text-transparent'}`}
                  style={{ width: KEYWORD_BOX, height: KEYWORD_BOX, fontSize: KEYWORD_BOX * 0.55 }}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        )}

        {crosswordShowClues && clues.length > 0 && (
          <ol className="self-start w-full px-2 text-gray-800" style={{ fontSize: CLUE_FONT, lineHeight: 1.45 }}>
            {entries.map((entry, index) =>
              entry.clue ? (
                <li key={index} className="mb-1">
                  <span className="font-semibold">{index + 1}.</span> {entry.clue}
                </li>
              ) : null,
            )}
          </ol>
        )}
      </div>
    </div>
  )
}
