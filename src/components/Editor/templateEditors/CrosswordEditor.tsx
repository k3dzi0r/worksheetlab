import { useMemo } from 'react'
import { buildCrossword, parseCrosswordLines } from '../../../crossword'
import type { WorksheetState } from '../../../types/worksheet'

interface CrosswordEditorRow {
  word: string
  clue: string
}

function parseCrosswordEditorRows(text: string): CrosswordEditorRow[] {
  if (text.length === 0) return [{ word: '', clue: '' }]
  return text.split('\n').map((line) => {
    const separator = line.match(/\s[-–—]\s|;|\t/)
    if (!separator || separator.index === undefined) return { word: line, clue: '' }
    const clueStart = separator.index + separator[0].length
    return { word: line.slice(0, separator.index), clue: line.slice(clueStart) }
  })
}

function serializeCrosswordEditorRows(rows: CrosswordEditorRow[]): string {
  return rows.map((row) => (row.clue ? `${row.word} - ${row.clue}` : row.word)).join('\n')
}

/** Słowa, hasło i opcje krzyżówki. */
export function CrosswordEditor({ worksheet, onCrosswordOptionsChange }: { worksheet: WorksheetState; onCrosswordOptionsChange: (options: Partial<WorksheetState>) => void }) {
  // Ostrzeżenie w edytorze: do których liter hasła zabrakło słowa.
  const crosswordSkipped = useMemo(() => {
    if (worksheet.template !== 'crossword') return []
    return buildCrossword(parseCrosswordLines(worksheet.crosswordWords || ''), {
      keyword: worksheet.crosswordKeyword || '',
      seed: 1,
    }).missingLetters
  }, [worksheet.template, worksheet.crosswordWords, worksheet.crosswordKeyword])

  const crosswordEditorRows = useMemo(
    () => parseCrosswordEditorRows(worksheet.crosswordWords || ''),
    [worksheet.crosswordWords],
  )

  function updateCrosswordRow(index: number, field: keyof CrosswordEditorRow, value: string) {
    const rows = crosswordEditorRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    )
    onCrosswordOptionsChange({ crosswordWords: serializeCrosswordEditorRows(rows) })
  }

  function addCrosswordRow() {
    onCrosswordOptionsChange({
      crosswordWords: serializeCrosswordEditorRows([...crosswordEditorRows, { word: '', clue: '' }]),
    })
  }

  function removeCrosswordRow(index: number) {
    const rows = crosswordEditorRows.filter((_, rowIndex) => rowIndex !== index)
    onCrosswordOptionsChange({ crosswordWords: serializeCrosswordEditorRows(rows) })
  }

  return (
    <>
    <section>
      <h2 className="text-lg font-semibold mb-2">Krzyżówka</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasło w kolumnie</label>
          <input
            type="text"
            value={worksheet.crosswordKeyword || ''}
            onChange={(event) => onCrosswordOptionsChange({ crosswordKeyword: event.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="np. WIOSNA"
          />
          <p className="text-xs text-gray-500 mt-1">
            Zostaw puste, a hasło ułoży się samo z losowo wybranych liter podanych słów.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Słowa i definicje</label>
            <button
              type="button"
              onClick={addCrosswordRow}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              + Dodaj wiersz
            </button>
          </div>
          <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_28px] gap-2 px-1 mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <span>Słowo</span>
            <span>Definicja</span>
            <span />
          </div>
          <div className="flex flex-col gap-2">
            {crosswordEditorRows.map((row, index) => (
              <div key={index} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_28px] gap-2 items-center">
                <input
                  type="text"
                  value={row.word}
                  onChange={(event) => updateCrosswordRow(index, 'word', event.target.value)}
                  aria-label={`Słowo ${index + 1}`}
                  className="min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={index === 0 ? 'kwiat' : 'słowo'}
                />
                <input
                  type="text"
                  value={row.clue}
                  onChange={(event) => updateCrosswordRow(index, 'clue', event.target.value)}
                  aria-label={`Definicja ${index + 1}`}
                  className="min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={index === 0 ? 'rośnie na łące' : 'definicja'}
                />
                <button
                  type="button"
                  onClick={() => removeCrosswordRow(index)}
                  disabled={crosswordEditorRows.length === 1 && !row.word && !row.clue}
                  aria-label={`Usuń wiersz ${index + 1}`}
                  title="Usuń wiersz"
                  className="w-7 h-9 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Każde hasło ma osobne pole na definicję, więc nic nie zlewa się w jeden tekst.
          </p>
          {crosswordSkipped.length > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Brakuje słowa z literą: {crosswordSkipped.join(', ')}. Dodaj słowo zawierające tę literę
              albo skróć hasło.
            </p>
          )}
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.crosswordShowClues ?? true}
            onChange={(event) => onCrosswordOptionsChange({ crosswordShowClues: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Definicje pod krzyżówką</span>
            <span className="block text-xs text-gray-500">Wyłącz, jeśli czytasz definicje na głos.</span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.crosswordNumbers ?? true}
            onChange={(event) => onCrosswordOptionsChange({ crosswordNumbers: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Numery wierszy</span>
            <span className="block text-xs text-gray-500">Łączą kratki z definicjami pod spodem.</span>
          </span>
        </label>
      </div>
    </section>
    </>
  )
}
