import { useRef } from 'react'
import { DEFAULT_HANDWRITING_FONT, getHandwritingFont, HANDWRITING_FONTS } from '../../../handwritingFonts'
import { GUIDE_LEVELS, TRACE_LEVELS } from '../../../templates/HandwritingTemplate'
import type { WorksheetState } from '../../../types/worksheet'

/** Tekst, czcionka i liniatura do nauki pisania. */
export function HandwritingEditor({ worksheet, onHandwritingTextChange, onHandwritingModeChange, onHandwritingRepeatChange, onHandwritingFontChange, onHandwritingOptionsChange }: { worksheet: WorksheetState; onHandwritingTextChange: (text: string) => void; onHandwritingModeChange: (mode: 'solid' | 'tracing' | 'empty') => void; onHandwritingRepeatChange: (repeat: boolean) => void; onHandwritingFontChange: (font: string) => void; onHandwritingOptionsChange: (options: Partial<WorksheetState>) => void }) {
  const handwritingTextareaRef = useRef<HTMLTextAreaElement>(null)


  const insertHandwritingTag = (tag: string) => {
    const el = handwritingTextareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = worksheet.handwritingText || ''
    const before = text.substring(0, start)
    const selected = text.substring(start, end)
    const after = text.substring(end)
    const newText = before + `[${tag}]` + selected + `[/${tag}]` + after
    onHandwritingTextChange(newText)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + 3, end + 3)
    }, 0)
  }

  return (
    <>
    <section>
      <h2 className="text-lg font-semibold mb-2">Tekst do pisania</h2>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Wpisz tekst
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => insertHandwritingTag('z')}
                className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                title="Czarny (zaznacz tekst i kliknij)"
              >
                Czarny
              </button>
              <button
                type="button"
                onClick={() => insertHandwritingTag('s')}
                className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                title="Ślad (zaznacz tekst i kliknij)"
              >
                Ślad
              </button>
            </div>
          </div>
          <textarea
            ref={handwritingTextareaRef}
            value={worksheet.handwritingText || ''}
            onChange={(e) => onHandwritingTextChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="np. Ala ma kota."
          />
          <p className="text-xs text-gray-500 mt-1">Zaznacz fragment i wybierz: czarny tekst albo ślad do obrysowania.</p>
        </div>
        
        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.handwritingRepeat}
            onChange={(event) => onHandwritingRepeatChange(event.target.checked)}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Zapełnij stronę</span>
            <span className="block text-xs text-gray-500">Powiel pierwszy wiersz na wszystkie linie.</span>
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Czcionka
          </label>
          <select
            value={worksheet.handwritingFont || DEFAULT_HANDWRITING_FONT}
            onChange={(e) => onHandwritingFontChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {HANDWRITING_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            {getHandwritingFont(worksheet.handwritingFont).description}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kontrast śladu</label>
          <div className="flex gap-2">
            {TRACE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => onHandwritingOptionsChange({ handwritingTrace: level.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.handwritingTrace ?? 'medium') === level.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Liniatura</label>
          <div className="flex gap-2">
            {GUIDE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => onHandwritingOptionsChange({ handwritingGuides: level.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.handwritingGuides ?? 'full') === level.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {level.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Sama linia podstawowa albo brak linii to kolejne etapy usamodzielniania dziecka.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.handwritingEveryOther ?? false}
            onChange={(event) => onHandwritingOptionsChange({ handwritingEveryOther: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Co drugi wiersz pusty</span>
            <span className="block text-xs text-gray-500">
              Dziecko przepisuje wzór do pustego wiersza pod spodem.
            </span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.handwritingStartDot ?? false}
            onChange={(event) => onHandwritingOptionsChange({ handwritingStartDot: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Kropka startowa</span>
            <span className="block text-xs text-gray-500">Zielona kropka na początku każdego wiersza.</span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.handwritingWideRowGap ?? false}
            onChange={(event) => onHandwritingOptionsChange({ handwritingWideRowGap: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Większy odstęp między wierszami</span>
            <span className="block text-xs text-gray-500">
              Ułatwienie dla dzieci, którym trudno trzymać się swojego wiersza.
            </span>
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Domyślny styl pisma
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onHandwritingModeChange('solid')}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.handwritingMode === 'solid' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Zwykły
            </button>
            <button
              onClick={() => onHandwritingModeChange('tracing')}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.handwritingMode === 'tracing' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Po śladzie
            </button>
            <button
              onClick={() => onHandwritingModeChange('empty')}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.handwritingMode === 'empty' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Tylko linie
            </button>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}
