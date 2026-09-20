const fs = require('fs');
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

// Remove MATH_RANGES from imports
editor = editor.replace(/, MATH_RANGES /, ' ');

const oldMathUI = `<div className="flex gap-2">
            {MATH_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => onMathOptionsChange({ mathMax: range })}
                className={\`flex-1 py-2 px-2 text-sm rounded-lg border \${(worksheet.mathMax ?? 20) === range ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}
              >
                do {range}
              </button>
            ))}
          </div>`;

const newMathUI = `<div className="flex items-center gap-4">
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
          </div>`;

editor = editor.replace(oldMathUI, newMathUI);

// Now conditional check for mathCrossTen
const oldCrossTen = `<label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={worksheet.mathCrossTen ?? true}
              onChange={(e) => onMathOptionsChange({ mathCrossTen: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">Przekraczanie progu dziesiątkowego</span>
          </label>`;

const newCrossTen = `{(!worksheet.mathMax || worksheet.mathMax > 10) && (
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              type="checkbox"
              checked={worksheet.mathCrossTen ?? true}
              onChange={(e) => onMathOptionsChange({ mathCrossTen: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">Przekraczanie progu dziesiątkowego</span>
          </label>
        )}`;

editor = editor.replace(oldCrossTen, newCrossTen);


fs.writeFileSync('src/components/Editor/Editor.tsx', editor);
