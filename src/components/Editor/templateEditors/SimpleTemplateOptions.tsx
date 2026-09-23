import type { WorksheetState } from '../../../types/worksheet'

/** Drobne opcje szablonów obrazkowych (Wybierz, Połącz w pary, Tak/Nie, ...). */
export function SimpleTemplateOptions({ worksheet, onUpdateOptions }: { worksheet: WorksheetState; onUpdateOptions: (options: Partial<WorksheetState>) => void }) {
  return (
    <>
  {worksheet.template === 'choice' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Opcje "Wybierz"</h2>
      <label className="flex items-center gap-2 cursor-pointer mt-2">
        <input type="checkbox" checked={worksheet.choiceShowCheckboxes || false} onChange={(e) => onUpdateOptions({ choiceShowCheckboxes: e.target.checked })} className="w-4 h-4 cursor-pointer" />
        <span className="text-sm font-medium text-gray-700">Pokaż puste kratki obok odpowiedzi (na ✓/✗)</span>
      </label>
    </section>
  )}

  {worksheet.template === 'matchPairs' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Styl linii bazowej</h2>
      <div className="flex gap-2">
        {(['solid', 'dashed', 'dotted'] as const).map(style => (
          <button key={style} type="button" onClick={() => onUpdateOptions({ matchPairsLineStyle: style })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.matchPairsLineStyle ?? 'solid') === style ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>
            {style === 'solid' ? 'Ciągła' : style === 'dashed' ? 'Przerywana' : 'Kropkowana'}
          </button>
        ))}
      </div>
    </section>
  )}

  {worksheet.template === 'yesNo' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Opcje Tak/Nie</h2>
      <label className="flex items-center gap-2 cursor-pointer mt-2">
        <input type="checkbox" checked={worksheet.yesNoUseColors || false} onChange={(e) => onUpdateOptions({ yesNoUseColors: e.target.checked })} className="w-4 h-4 cursor-pointer" />
        <span className="text-sm font-medium text-gray-700">Użyj kolorów (zielone Tak, czerwone Nie)</span>
      </label>
    </section>
  )}

  {worksheet.template === 'count' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Ułożenie elementów</h2>
      <div className="flex gap-2">
        <button type="button" onClick={() => onUpdateOptions({ countScattered: false })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${!worksheet.countScattered ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Siatka</button>
        <button type="button" onClick={() => onUpdateOptions({ countScattered: true })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${worksheet.countScattered ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Losowo</button>
      </div>
    </section>
  )}

  {worksheet.template === 'sequence' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Puste pola na odpowiedź</h2>
      <div className="flex gap-2">
        <button type="button" onClick={() => onUpdateOptions({ sequenceBlankStyle: 'underscore' })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.sequenceBlankStyle ?? 'underscore') === 'underscore' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Podkreślenia</button>
        <button type="button" onClick={() => onUpdateOptions({ sequenceBlankStyle: 'box' })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.sequenceBlankStyle ?? 'underscore') === 'box' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Puste ramki</button>
      </div>
    </section>
  )}

  {worksheet.template === 'cutCards' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Kolumny kartoników</h2>
      <div className="flex gap-2">
        {[2, 3, 4, 5].map(cols => (
          <button key={cols} type="button" onClick={() => onUpdateOptions({ cutCardsPerRow: cols })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.cutCardsPerRow ?? 3) === cols ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>
            {cols}
          </button>
        ))}
      </div>
    </section>
  )}

  {worksheet.template === 'sameOrDifferent' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Wyróżnienie wzorca</h2>
      <div className="flex gap-2">
        {(['box', 'underline', 'none'] as const).map(style => (
          <button key={style} type="button" onClick={() => onUpdateOptions({ sameOrDifferentReferenceStyle: style })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.sameOrDifferentReferenceStyle ?? 'box') === style ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>
            {style === 'box' ? 'Ramka' : style === 'underline' ? 'Podkreślenie' : 'Brak'}
          </button>
        ))}
      </div>
    </section>
  )}

  {worksheet.template === 'categorize' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Tryb wyświetlania</h2>
      <div className="flex gap-2">
        <button type="button" onClick={() => onUpdateOptions({ categorizeLayout: 'columns' })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.categorizeLayout ?? 'columns') === 'columns' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Kolumny</button>
        <button type="button" onClick={() => onUpdateOptions({ categorizeLayout: 'areas' })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.categorizeLayout ?? 'columns') === 'areas' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Zamknięte obszary</button>
      </div>
    </section>
  )}
    </>
  )
}
