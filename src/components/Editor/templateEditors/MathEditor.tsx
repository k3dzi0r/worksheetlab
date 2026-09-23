import { MATH_OPERATION_LABELS, MATH_OPERATION_SIGNS } from '../../../mathTasks'
import type { MathOperation } from '../../../mathTasks'
import type { WorksheetState } from '../../../types/worksheet'

/** Przełącza rodzaj działania, ale nie pozwala odznaczyć ostatniego - karta nie może być pusta. */
function toggleMathOperation(current: MathOperation[] | undefined, operation: MathOperation): MathOperation[] {
  const operations = current && current.length > 0 ? current : (['add'] as MathOperation[])
  if (!operations.includes(operation)) return [...operations, operation]
  const remaining = operations.filter((op) => op !== operation)
  return remaining.length > 0 ? remaining : operations
}

/** Rodzaje działań i zakres liczb. */
export function MathEditor({ worksheet, onMathOptionsChange }: { worksheet: WorksheetState; onMathOptionsChange: (options: Partial<WorksheetState>) => void }) {
  return (
    <>
    <section>
      <h2 className="text-lg font-semibold mb-2">Działania</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rodzaje działań</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MATH_OPERATION_LABELS) as MathOperation[]).map((operation) => {
              const active = (worksheet.mathOperations || ['add']).includes(operation)
              return (
                <button
                  key={operation}
                  type="button"
                  onClick={() => onMathOptionsChange({ mathOperations: toggleMathOperation(worksheet.mathOperations, operation) })}
                  className={`py-2 px-2 text-sm rounded-lg border ${active ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
                >
                  {MATH_OPERATION_LABELS[operation]} {MATH_OPERATION_SIGNS[operation]}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zakres liczbowy</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="200"
              step="1"
              value={worksheet.mathMax ?? 20}
              onChange={(e) => onMathOptionsChange({ mathMax: parseInt(e.target.value, 10) })}
              className="flex-1"
            />
            <input 
              type="number"
              min="10"
              max="1000"
              value={worksheet.mathMax ?? 20}
              onChange={(e) => onMathOptionsChange({ mathMax: parseInt(e.target.value, 10) || 10 })}
              className="w-20 text-right border border-gray-300 rounded px-2 py-1 text-sm font-medium"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={!(worksheet.mathCrossTen ?? true)}
            onChange={(event) => onMathOptionsChange({ mathCrossTen: !event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Bez przekraczania progu dziesiątkowego</span>
            <span className="block text-xs text-gray-500">
              Dziecko liczy w obrębie jednej dziesiątki (7 + 2, nie 7 + 5). Dotyczy dodawania i odejmowania.
            </span>
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Co uczeń uzupełnia</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onMathOptionsChange({ mathMissing: 'result' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.mathMissing ?? 'result') === 'result' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Wynik
            </button>
            <button
              type="button"
              onClick={() => onMathOptionsChange({ mathMissing: 'operand' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.mathMissing === 'operand' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Składnik
            </button>
            <button
              type="button"
              onClick={() => onMathOptionsChange({ mathMissing: 'mixed' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.mathMissing === 'mixed' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Na zmianę
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Działania wypełniają całą kartkę - liczbę kolumn ustawisz suwakiem rozmiaru elementów.
          „Pokaż klucz odpowiedzi" wpisuje wyniki w ramki.
        </p>
      </div>
    </section>
    </>
  )
}
