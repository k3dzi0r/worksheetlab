import { useMemo } from 'react'
import type { WorksheetState } from '../../../types/worksheet'
import { generateWordSearch, parseWords } from '../../../wordSearch'

/** Słowa i siatka wykreślanki. */
export function WordSearchEditor({ worksheet, onWordSearchOptionsChange }: { worksheet: WorksheetState; onWordSearchOptionsChange: (options: Partial<WorksheetState>) => void }) {
  // Ostrzeżenie w edytorze: które słowa nie zmieściły się w siatce wykreślanki.
  const wordSearchSkipped = useMemo(() => {
    if (worksheet.template !== 'wordSearch') return []
    const size = worksheet.wordSearchGridSize || 10
    return generateWordSearch(parseWords(worksheet.wordSearchWords || ''), {
      cols: size,
      rows: size,
      allowHorizontal: worksheet.wordSearchAllowHorizontal ?? true,
      allowVertical: worksheet.wordSearchAllowVertical ?? true,
      allowDiagonals: worksheet.wordSearchAllowDiagonals ?? false,
      allowReverse: worksheet.wordSearchAllowReverse ?? false,
      filler: 'random',
      seed: 1,
    }).skipped
  }, [
    worksheet.template,
    worksheet.wordSearchWords,
    worksheet.wordSearchGridSize,
    worksheet.wordSearchAllowHorizontal,
    worksheet.wordSearchAllowVertical,
    worksheet.wordSearchAllowDiagonals,
    worksheet.wordSearchAllowReverse,
  ])

  function updateWordSearchDirection(
    field: 'wordSearchAllowHorizontal' | 'wordSearchAllowVertical' | 'wordSearchAllowDiagonals',
    checked: boolean,
  ) {
    const next = {
      wordSearchAllowHorizontal: worksheet.wordSearchAllowHorizontal ?? true,
      wordSearchAllowVertical: worksheet.wordSearchAllowVertical ?? true,
      wordSearchAllowDiagonals: worksheet.wordSearchAllowDiagonals ?? false,
      [field]: checked,
    }
    if (!next.wordSearchAllowHorizontal && !next.wordSearchAllowVertical && !next.wordSearchAllowDiagonals) return
    onWordSearchOptionsChange({ [field]: checked })
  }

  return (
    <>
    <section>
      <h2 className="text-lg font-semibold mb-2">Słowa do ukrycia</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wpisz słowa (jedno w wierszu)</label>
          <textarea
            value={worksheet.wordSearchWords || ''}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchWords: event.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
            placeholder={'kot\npies\nsowa'}
          />
          {wordSearchSkipped.length > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Nie zmieściły się w siatce: {wordSearchSkipped.join(', ')}. Zwiększ rozmiar siatki lub skróć słowa.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rozmiar siatki: {worksheet.wordSearchGridSize || 10} × {worksheet.wordSearchGridSize || 10}
          </label>
          <input
            type="range"
            min={6}
            max={18}
            step={1}
            value={worksheet.wordSearchGridSize || 10}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchGridSize: Number(event.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kształt siatki</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onWordSearchOptionsChange({ wordSearchShape: 'square' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.wordSearchShape ?? 'square') === 'square' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Kwadrat
            </button>
            <button
              type="button"
              onClick={() => onWordSearchOptionsChange({ wordSearchShape: 'page' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.wordSearchShape === 'page' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Na całą kartkę
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Na całą kartkę siatka dostaje tyle wierszy, ile zmieści się w pionie - zmieści więcej słów.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Wypełnienie pustych pól</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onWordSearchOptionsChange({ wordSearchFiller: 'random' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.wordSearchFiller ?? 'random') === 'random' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Losowe litery
            </button>
            <button
              type="button"
              onClick={() => onWordSearchOptionsChange({ wordSearchFiller: 'fromWords' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.wordSearchFiller === 'fromWords' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Litery z ukrytych słów
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Litery z ukrytych słów są trudniejsze - żadna przypadkowa litera nie zdradza pustego miejsca.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.wordSearchShowWords ?? true}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchShowWords: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Lista słów pod siatką</span>
            <span className="block text-xs text-gray-500">
              Bez listy zostaje sama liczba ukrytych słów - zadanie jest wtedy dużo trudniejsze.
            </span>
          </span>
        </label>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Kierunki ukrywania słów</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['wordSearchAllowHorizontal', 'Poziom', worksheet.wordSearchAllowHorizontal ?? true],
              ['wordSearchAllowVertical', 'Pion', worksheet.wordSearchAllowVertical ?? true],
              ['wordSearchAllowDiagonals', 'Ukos', worksheet.wordSearchAllowDiagonals ?? false],
            ] as const).map(([field, label, checked]) => (
              <label key={field} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => updateWordSearchDirection(field, event.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-semibold text-gray-900 text-sm">{label}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={worksheet.wordSearchAllowReverse ?? false}
                onChange={(event) => onWordSearchOptionsChange({ wordSearchAllowReverse: event.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-semibold text-gray-900 text-sm">Wspak</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Zostaw co najmniej jeden kierunek. „Wspak” działa z każdym zaznaczonym kierunkiem.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.wordSearchUppercase ?? true}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchUppercase: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Wielkie litery</span>
            <span className="block text-xs text-gray-500">Wyłącz, żeby wydrukować małe litery.</span>
          </span>
        </label>
      </div>
    </section>
    </>
  )
}
