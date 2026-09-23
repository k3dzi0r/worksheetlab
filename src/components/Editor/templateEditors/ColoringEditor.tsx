import { COLOR_COUNT_MAX, COLOR_COUNT_MIN, COLORING_LEVELS, getColoringLevel } from '../../../coloring'
import type { CrownStyle } from '../../../coloring'
import type { WorksheetState } from '../../../types/worksheet'

const COLORING_CROWNS: { value: CrownStyle; label: string }[] = [
  { value: 'auto', label: 'Losowo' },
  { value: 'scallop', label: 'Ząbki' },
  { value: 'petal', label: 'Płatki' },
  { value: 'points', label: 'Kolce' },
  { value: 'none', label: 'Gładka' },
]

/** Ustawienia kolorowanki. */
export function ColoringEditor({ worksheet, onColoringOptionsChange }: { worksheet: WorksheetState; onColoringOptionsChange: (options: Partial<WorksheetState>) => void }) {
  return (
    <>
    <section>
      <h2 className="text-lg font-semibold mb-2">Kolorowanka</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rodzaj</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onColoringOptionsChange({ coloringMode: 'blank' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.coloringMode ?? 'blank') === 'blank' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Zwykła
            </button>
            <button
              type="button"
              onClick={() => onColoringOptionsChange({ coloringMode: 'numbers' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.coloringMode === 'numbers' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Koloruj wg kodu
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Złożoność wzoru: {getColoringLevel(worksheet.coloringLevel).label}
          </label>
          <input
            type="range"
            min={COLORING_LEVELS[0].value}
            max={COLORING_LEVELS[COLORING_LEVELS.length - 1].value}
            step={1}
            value={worksheet.coloringLevel ?? 2}
            onChange={(event) => onColoringOptionsChange({ coloringLevel: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Im prostszy wzór, tym większe pola - dla młodszych dzieci wybierz niższy poziom.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Osie symetrii: {worksheet.coloringSectors ? worksheet.coloringSectors : 'losowo'}
          </label>
          <input
            type="range"
            min={0}
            max={24}
            step={2}
            value={worksheet.coloringSectors ?? 0}
            onChange={(event) => onColoringOptionsChange({ coloringSectors: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Na zero każdy wariant karty dostaje inną liczbę osi - wzory są wtedy wyraźnie różne.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Krawędź wzoru</label>
          <div className="grid grid-cols-3 gap-2">
            {COLORING_CROWNS.map((crown) => (
              <button
                key={crown.value}
                type="button"
                onClick={() => onColoringOptionsChange({ coloringCrown: crown.value })}
                className={`py-2 px-2 text-sm rounded-lg border ${(worksheet.coloringCrown ?? 'auto') === crown.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {crown.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grubość linii: {Math.round((worksheet.coloringStroke ?? 1) * 100)}%
          </label>
          <input
            type="range"
            min={0.7}
            max={1.6}
            step={0.1}
            value={worksheet.coloringStroke ?? 1}
            onChange={(event) => onColoringOptionsChange({ coloringStroke: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Grubsza kreska dla młodszych dzieci - łatwiej kolorować bez wychodzenia za linię.
          </p>
        </div>

        {worksheet.coloringMode === 'numbers' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liczba kolorów: {worksheet.coloringColorCount ?? 4}
            </label>
            <input
              type="range"
              min={COLOR_COUNT_MIN}
              max={COLOR_COUNT_MAX}
              step={1}
              value={worksheet.coloringColorCount ?? 4}
              onChange={(event) => onColoringOptionsChange({ coloringColorCount: Number(event.target.value) })}
              className="w-full"
            />
          </div>
        )}

        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Każdy wariant karty to inny wzór - ustaw liczbę wariantów w sekcji „Warianty”, żeby wydrukować
          kilka różnych kolorowanek naraz. „Pokaż klucz odpowiedzi" pokazuje gotowy, pokolorowany wzór.
        </p>
      </div>
    </section>
    </>
  )
}
