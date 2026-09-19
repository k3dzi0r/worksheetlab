const fs = require('fs');
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

editor = editor.replace(/  onSimpleModeChange: \(simpleMode: boolean\) => void\n/, '');
editor = editor.replace(/  onSimpleModeChange,\n/, '');

const simpleModeCheckbox = `        <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={worksheet.simpleMode}
              onChange={(event) => onSimpleModeChange(event.target.checked)}
              className="w-5 h-5"
            />
            <span className="font-medium text-gray-700">Tryb prosty (duże elementy)</span>
          </label>
        </div>`;

const instructionScaleSlider = `        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Wielkość polecenia</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={worksheet.instructionScale ?? 1}
              onChange={(e) => onUpdateOptions({ instructionScale: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm font-medium w-12 text-right">
              {Math.round((worksheet.instructionScale ?? 1) * 100)}%
            </span>
          </div>
        </div>`;

editor = editor.replace(simpleModeCheckbox, instructionScaleSlider);

const oldMathUI = `<div className="flex gap-2">
            {(['10', '20', '100'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onUpdateOptions({ mathRange: r })}
                className={\`flex-1 py-2 px-3 text-sm rounded-lg border \${
                  worksheet.mathRange === r
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                    : 'bg-white border-gray-300 text-gray-700'
                }\`}
              >
                Do {r}
              </button>
            ))}
          </div>`;

const newMathUI = `<div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="200"
              step="1"
              value={worksheet.mathMaxRange ?? 10}
              onChange={(e) => onUpdateOptions({ mathMaxRange: parseInt(e.target.value, 10) })}
              className="flex-1"
            />
            <input 
              type="number"
              min="10"
              max="1000"
              value={worksheet.mathMaxRange ?? 10}
              onChange={(e) => onUpdateOptions({ mathMaxRange: parseInt(e.target.value, 10) || 10 })}
              className="w-20 text-right border border-gray-300 rounded px-2 py-1 text-sm font-medium"
            />
          </div>`;

editor = editor.replace(oldMathUI, newMathUI);

const oldMathCrossTen = `<label className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              type="checkbox"
              checked={worksheet.mathCrossTen ?? false}
              onChange={(e) => onUpdateOptions({ mathCrossTen: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">Przekraczanie progu dziesiątkowego</span>
          </label>`;

const newMathCrossTen = `{worksheet.mathMaxRange && worksheet.mathMaxRange > 10 && (
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              type="checkbox"
              checked={worksheet.mathCrossTen ?? false}
              onChange={(e) => onUpdateOptions({ mathCrossTen: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">Przekraczanie progu dziesiątkowego</span>
          </label>
          )}`;

editor = editor.replace(oldMathCrossTen, newMathCrossTen);


fs.writeFileSync('src/components/Editor/Editor.tsx', editor);
