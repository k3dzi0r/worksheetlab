import { PATTERNS } from '../../../patterns'
import { PATTERN_LENGTH_MAX, PATTERN_LENGTH_MIN } from '../../../templates/PatternTemplate'
import type { WorksheetState } from '../../../types/worksheet'

/** Ustawienia szlaczków. */
export function PatternEditor({ worksheet, onPatternOptionsChange }: { worksheet: WorksheetState; onPatternOptionsChange: (options: Partial<WorksheetState>) => void }) {
  return (
    <>
    <section>
      <h2 className="text-lg font-semibold mb-2">Szlaczek</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Wzór</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onPatternOptionsChange({ patternId: 'mixed' })}
              className={`py-2 px-2 text-sm rounded-lg border ${worksheet.patternId === 'mixed' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Różne
            </button>
            {PATTERNS.map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                onClick={() => onPatternOptionsChange({ patternId: pattern.id })}
                className={`py-2 px-2 text-sm rounded-lg border ${(worksheet.patternId ?? 'waves') === pattern.id ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {pattern.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            „Różne" daje inny szlaczek w każdym wierszu, a każdemu wariantowi karty inny zestaw.
          </p>
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Długość szlaczka</span>
            <span className="tabular-nums text-blue-700">{Math.round(worksheet.patternLength ?? 50)}%</span>
          </label>
          <input
            type="range"
            min={PATTERN_LENGTH_MIN}
            max={PATTERN_LENGTH_MAX}
            step={1}
            value={worksheet.patternLength ?? 50}
            onChange={(event) => onPatternOptionsChange({ patternLength: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Przesuń płynnie: wiersz zaczyna się gotowym wzorem, dalej idzie ślad do obrysowania,
            a pozostała część zostaje na samodzielne rysowanie.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.patternGuides ?? true}
            onChange={(event) => onPatternOptionsChange({ patternGuides: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Linie pomocnicze</span>
            <span className="block text-xs text-gray-500">Wzór nie wychodzi poza linie, tak jak w liniaturze.</span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.patternStartDot ?? true}
            onChange={(event) => onPatternOptionsChange({ patternStartDot: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Kropka startowa</span>
            <span className="block text-xs text-gray-500">Zielona kropka pokazuje, gdzie postawić ołówek.</span>
          </span>
        </label>
      </div>
    </section>
    </>
  )
}
