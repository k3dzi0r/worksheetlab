const fs = require('fs');
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

const simpleModeRegex = /\{\/\* Tryb prosty[\s\S]*?<\/section>/;
const instructionScaleSlider = `{/* Wielkość polecenia */}
      <section>
        <div className="flex flex-col gap-2">
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
        </div>
      </section>`;

editor = editor.replace(simpleModeRegex, instructionScaleSlider);

fs.writeFileSync('src/components/Editor/Editor.tsx', editor);
