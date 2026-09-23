import { DOT_NUMBERING, DOT_SHAPES } from '../../../dotToDot'
import type { WorksheetState } from '../../../types/worksheet'

/** Ustawienia „Połącz kropki". */
export function DotToDotEditor({ worksheet, onDotOptionsChange }: { worksheet: WorksheetState; onDotOptionsChange: (options: Partial<WorksheetState>) => void }) {
  return (
    <>
    <section>
      <h2 className="text-lg font-semibold mb-2">Połącz kropki</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Obrazek</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onDotOptionsChange({ dotShape: 'random' })}
              className={`py-2 px-2 text-sm rounded-lg border ${worksheet.dotShape === 'random' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Losowy
            </button>
            {DOT_SHAPES.map((shape) => (
              <button
                key={shape.id}
                type="button"
                onClick={() => onDotOptionsChange({ dotShape: shape.id })}
                className={`py-2 px-2 text-sm rounded-lg border ${(worksheet.dotShape ?? 'star') === shape.id ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {shape.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Przy losowym obrazku każdy wariant karty dostaje inny kształt.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Liczba kropek: {worksheet.dotCount ?? 20}
          </label>
          <input
            type="range"
            min={8}
            max={60}
            step={1}
            value={worksheet.dotCount ?? 20}
            onChange={(event) => onDotOptionsChange({ dotCount: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Mniej kropek to prostszy kształt i większe cyfry; więcej - dokładniejszy obrazek.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numeracja</label>
          <div className="grid grid-cols-4 gap-2">
            {DOT_NUMBERING.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onDotOptionsChange({ dotNumbering: option.value })}
                className={`py-2 px-1 text-sm rounded-lg border ${(worksheet.dotNumbering ?? 'numbers') === option.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            „Co drugi" ćwiczy liczenie dwójkami, „Wspak" - odliczanie w dół, „Litery" - alfabet.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.dotShowOutline ?? false}
            onChange={(event) => onDotOptionsChange({ dotShowOutline: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Blady kontur</span>
            <span className="block text-xs text-gray-500">
              Podpowiedź dla najmłodszych - widać, co powstanie po połączeniu kropek.
            </span>
          </span>
        </label>
      </div>
    </section>
    </>
  )
}
