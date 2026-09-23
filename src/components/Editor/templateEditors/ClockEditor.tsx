import { CLOCK_PRECISIONS } from '../../../clockTasks'
import { CLOCK_DIALS } from '../../../templates/ClockTemplate'
import type { WorksheetState } from '../../../types/worksheet'

/** Ustawienia ćwiczeń z zegarem. */
export function ClockEditor({ worksheet, onClockOptionsChange }: { worksheet: WorksheetState; onClockOptionsChange: (options: Partial<WorksheetState>) => void }) {
  return (
    <>
    <section>
      <h2 className="text-lg font-semibold mb-2">Zegar</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rodzaj ćwiczenia</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onClockOptionsChange({ clockMode: 'read' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.clockMode ?? 'read') === 'read' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Odczytaj
            </button>
            <button
              type="button"
              onClick={() => onClockOptionsChange({ clockMode: 'draw' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.clockMode === 'draw' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Narysuj
            </button>
            <button
              type="button"
              onClick={() => onClockOptionsChange({ clockMode: 'mixed' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.clockMode === 'mixed' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Na zmianę
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            „Odczytaj" daje zegar ze wskazówkami i pole na godzinę, „Narysuj" - godzinę i pustą tarczę.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dokładność</label>
          <div className="grid grid-cols-3 gap-2">
            {CLOCK_PRECISIONS.map((precision) => (
              <button
                key={precision.value}
                type="button"
                onClick={() => onClockOptionsChange({ clockPrecision: precision.value })}
                className={`py-2 px-1 text-sm rounded-lg border ${(worksheet.clockPrecision ?? 'hour') === precision.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {precision.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cyfry na tarczy</label>
          <div className="flex gap-2">
            {CLOCK_DIALS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onClockOptionsChange({ clockDial: option.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.clockDial ?? 'all') === option.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.clockFormat24 ?? false}
            onChange={(event) => onClockOptionsChange({ clockFormat24: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Zapis 24-godzinny</span>
            <span className="block text-xs text-gray-500">
              Losuje też godziny popołudniowe: wskazówka na trójce, a zapis to 15:00.
            </span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.clockMinuteTicks ?? true}
            onChange={(event) => onClockOptionsChange({ clockMinuteTicks: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Kreski minutowe</span>
            <span className="block text-xs text-gray-500">Pomagają odczytać minuty; bez nich tarcza jest czytelniejsza.</span>
          </span>
        </label>

        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Zegary wypełniają kartkę - ich wielkość ustawisz suwakiem rozmiaru elementów.
        </p>
      </div>
    </section>
    </>
  )
}
