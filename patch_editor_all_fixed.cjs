const fs = require('fs');
let content = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

// Step 1 & 4: Rename, remove pencil, fix tips
content = content.replace(/WorksheetLab/g, 'KartoLab');
content = content.replace(/<img src=\{`\$\{import.meta.env.BASE_URL\}illustrations\/pencil.webp`\} alt="" className="w-24 opacity-90 hidden 2xl:block self-center mb-4" aria-hidden="true" \/>\s*/g, '');
content = content.replace(/bg-amber-50/g, 'bg-blue-50');
content = content.replace(/border-amber-200/g, 'border-blue-200');
content = content.replace(/text-amber-500/g, 'text-blue-500');
content = content.replace(/text-amber-900/g, 'text-blue-900');
content = content.replace(/text-amber-800/g, 'text-blue-800');

// Step 2: Remove oddOneOut
content = content.replace(/, 'oddOneOut'/g, '');

// Step 3: Add onUpdateOptions prop
content = content.replace(
  /  onInstructionChange: \(instruction: string\) => void/,
  `  onInstructionChange: (instruction: string) => void\n  onUpdateOptions: (options: Partial<WorksheetState>) => void`
);
content = content.replace(
  /  onInstructionChange,\n/,
  `  onInstructionChange,\n  onUpdateOptions,\n`
);

const additionalOptionsUI = `
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
          <button key={style} type="button" onClick={() => onUpdateOptions({ matchPairsLineStyle: style })} className={\`flex-1 py-1.5 px-2 text-sm rounded-lg border \${(worksheet.matchPairsLineStyle ?? 'solid') === style ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}>
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
        <button type="button" onClick={() => onUpdateOptions({ countScattered: false })} className={\`flex-1 py-1.5 px-2 text-sm rounded-lg border \${!worksheet.countScattered ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}>Siatka</button>
        <button type="button" onClick={() => onUpdateOptions({ countScattered: true })} className={\`flex-1 py-1.5 px-2 text-sm rounded-lg border \${worksheet.countScattered ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}>Losowo</button>
      </div>
    </section>
  )}

  {worksheet.template === 'sequence' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Puste pola na odpowiedź</h2>
      <div className="flex gap-2">
        <button type="button" onClick={() => onUpdateOptions({ sequenceBlankStyle: 'underscore' })} className={\`flex-1 py-1.5 px-2 text-sm rounded-lg border \${(worksheet.sequenceBlankStyle ?? 'underscore') === 'underscore' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}>Podkreślenia</button>
        <button type="button" onClick={() => onUpdateOptions({ sequenceBlankStyle: 'box' })} className={\`flex-1 py-1.5 px-2 text-sm rounded-lg border \${(worksheet.sequenceBlankStyle ?? 'underscore') === 'box' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}>Puste ramki</button>
      </div>
    </section>
  )}

  {worksheet.template === 'cutCards' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Kolumny kartoników</h2>
      <div className="flex gap-2">
        {[2, 3, 4, 5].map(cols => (
          <button key={cols} type="button" onClick={() => onUpdateOptions({ cutCardsPerRow: cols })} className={\`flex-1 py-1.5 px-2 text-sm rounded-lg border \${(worksheet.cutCardsPerRow ?? 3) === cols ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}>
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
          <button key={style} type="button" onClick={() => onUpdateOptions({ sameOrDifferentReferenceStyle: style })} className={\`flex-1 py-1.5 px-2 text-sm rounded-lg border \${(worksheet.sameOrDifferentReferenceStyle ?? 'box') === style ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}>
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
        <button type="button" onClick={() => onUpdateOptions({ categorizeLayout: 'columns' })} className={\`flex-1 py-1.5 px-2 text-sm rounded-lg border \${(worksheet.categorizeLayout ?? 'columns') === 'columns' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}>Kolumny</button>
        <button type="button" onClick={() => onUpdateOptions({ categorizeLayout: 'areas' })} className={\`flex-1 py-1.5 px-2 text-sm rounded-lg border \${(worksheet.categorizeLayout ?? 'columns') === 'areas' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}\`}>Zamknięte obszary</button>
      </div>
    </section>
  )}
`;
content = content.replace(
  /<Step step=\{3\} active=\{activeStep\}>/,
  `<Step step={3} active={activeStep}>\n${additionalOptionsUI}`
);

// Step 5: Collapsible panels
content = content.replace(
  /const \[activeStep, setActiveStep\] = useState\(1\)/,
  `const [activeStep, setActiveStep] = useState(1)\n  const [isNavCollapsed, setIsNavCollapsed] = useState(false)\n  const [isContentCollapsed, setIsContentCollapsed] = useState(false)`
);

// We replace `<nav className="step-nav">` with collapsed classes
content = content.replace(
  /<nav className="step-nav">/,
  `<nav className={\`step-nav relative transition-all duration-300 ease-in-out \${isNavCollapsed ? '!w-16 !px-2 overflow-hidden' : ''}\`}>
        <button 
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm z-50 text-gray-500 hover:text-gray-700 hidden md:block"
        >
          <svg className={\`w-4 h-4 transform transition-transform \${isNavCollapsed ? 'rotate-180' : ''}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>`
);

content = content.replace(
  /<h1 className="text-xl font-bold text-gray-900">KartoLab<\/h1>\n\s*<p className="text-gray-500 text-xs">Kreator kart pracy A4<\/p>/,
  `<h1 className={\`text-xl font-bold text-gray-900 transition-opacity \${isNavCollapsed ? 'opacity-0 whitespace-nowrap' : 'opacity-100'}\`}>KartoLab</h1>
          <p className={\`text-gray-500 text-xs transition-opacity \${isNavCollapsed ? 'opacity-0 whitespace-nowrap' : 'opacity-100'}\`}>Kreator kart pracy A4</p>`
);

content = content.replace(
  /\{STEPS\.map\(\(step\) => \{[\s\S]*?return \([\s\S]*?<\/button>\n\s*<\/li>\n\s*\)\n\s*\}\)\}/,
  `{STEPS.map((step) => {
            const active = activeStep === step.id
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={\`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border transition-colors \${
                    active
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } \${isNavCollapsed ? 'justify-center' : ''}\`}
                >
                  <span
                    className={\`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold shrink-0 \${
                      active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }\`}
                  >
                    {step.id}
                  </span>
                  {!isNavCollapsed && (
                  <span className="min-w-0">
                    <span className={\`block text-sm font-semibold \${active ? 'text-blue-800' : 'text-gray-900'}\`}>
                      {step.title}
                    </span>
                    <span className="block text-xs text-gray-500 truncate">{step.hint}</span>
                  </span>
                  )}
                </button>
              </li>
            )
          })}`
);

content = content.replace(
  /<div className="mt-6">\s*<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Szybkie opcje<\/h2>/,
  `<div className={\`mt-6 transition-opacity \${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}\`}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Szybkie opcje</h2>`
);

content = content.replace(
  /<div className="mt-8">\s*<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dodatkowe działania<\/h2>/,
  `<div className={\`mt-8 transition-opacity \${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}\`}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dodatkowe działania</h2>`
);

content = content.replace(
  /<div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-3 relative overflow-hidden">/,
  `<div className={\`mt-6 bg-blue-50 border border-blue-200 rounded-xl p-3 relative overflow-hidden transition-opacity \${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}\`}>`
);

content = content.replace(
  /<div className="mt-auto pt-6 flex flex-col justify-end min-h-\[160px\]">/,
  `<div className={\`mt-auto pt-6 flex flex-col justify-end min-h-[160px] transition-opacity \${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}\`}>`
);


// Update step-content
content = content.replace(
  /<div className="step-content">/,
  `<div className={\`step-content relative transition-all duration-300 ease-in-out bg-white \${isContentCollapsed ? '!w-0 overflow-hidden border-none' : ''}\`}>
        <button 
          onClick={() => setIsContentCollapsed(!isContentCollapsed)}
          className={\`absolute top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm z-50 text-gray-500 hover:text-gray-700 hidden md:block transition-all \${isContentCollapsed ? '-left-8' : '-left-3'}\`}
        >
          <svg className={\`w-4 h-4 transform transition-transform \${isContentCollapsed ? 'rotate-180' : ''}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={\`w-[392px] max-w-[100vw] h-full overflow-y-auto p-6 transition-opacity duration-200 \${isContentCollapsed ? 'opacity-0 invisible' : 'opacity-100'}\`}>`
);

// Close inner wrapper div
// Find exactly `</Step>\n    </div>\n  )\n}`
content = content.replace(
  /<\/Step>\n      <\/div>\n    <\/div>\n  \)\n\}/,
  `</Step>\n        </div>\n    </div>\n  )\n}`
);


fs.writeFileSync('src/components/Editor/Editor.tsx', content);
