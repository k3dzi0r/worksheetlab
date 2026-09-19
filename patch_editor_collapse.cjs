const fs = require('fs');
let content = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

// Add states
content = content.replace(
  /const \[activeStep, setActiveStep\] = useState<number>\(1\)/,
  `const [activeStep, setActiveStep] = useState<number>(1)
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const [isContentCollapsed, setIsContentCollapsed] = useState(false)`
);

// Update step-nav div
content = content.replace(
  /<div className="step-nav print:hidden">/,
  `<div className={\`step-nav print:hidden relative transition-all duration-300 ease-in-out \${isNavCollapsed ? '!w-16 !px-2 overflow-hidden' : ''}\`}>
        <button 
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm z-50 text-gray-500 hover:text-gray-700 hidden md:block"
        >
          <svg className={\`w-4 h-4 transform transition-transform \${isNavCollapsed ? 'rotate-180' : ''}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>`
);

// We need to hide texts in step-nav when collapsed
content = content.replace(
  /<h1 className="font-extrabold text-2xl tracking-tight text-gray-900 mb-6 px-1">\s*KartoLab\s*<\/h1>/,
  `<h1 className={\`font-extrabold text-2xl tracking-tight text-gray-900 mb-6 px-1 transition-opacity \${isNavCollapsed ? 'opacity-0 whitespace-nowrap' : 'opacity-100'}\`}>KartoLab</h1>`
);

content = content.replace(
  /\{STEPS\.map\(\(step\) => \(\s*<button[\s\S]*?<\/button>\s*\)\)\}/,
  `{STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left cursor-pointer \${
                activeStep === step.id
                  ? 'bg-blue-600 shadow-md shadow-blue-600/20 transform scale-[1.02]'
                  : 'hover:bg-gray-100'
              } \${isNavCollapsed ? 'justify-center' : ''}\`}
            >
              <div
                className={\`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm shrink-0 transition-colors \${
                  activeStep === step.id ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'
                }\`}
              >
                {step.id}
              </div>
              {!isNavCollapsed && (
                <div>
                  <div className={\`text-sm font-bold \${activeStep === step.id ? 'text-white' : 'text-gray-900'}\`}>
                    {step.title}
                  </div>
                  <div className={\`text-xs font-medium \${activeStep === step.id ? 'text-blue-100' : 'text-gray-500'}\`}>
                    {step.hint}
                  </div>
                </div>
              )}
            </button>
          ))}`
);

content = content.replace(
  /<div className="mt-8">\s*<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">\s*Szybkie opcje\s*<\/h3>/,
  `<div className={\`mt-8 transition-opacity \${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}\`}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Szybkie opcje</h3>`
);

content = content.replace(
  /<div className="mt-8">\s*<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">\s*Dodatkowe działania\s*<\/h3>/,
  `<div className={\`mt-8 transition-opacity \${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}\`}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Dodatkowe działania</h3>`
);

content = content.replace(
  /<div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-3 relative overflow-hidden">/,
  `<div className={\`mt-6 bg-blue-50 border border-blue-200 rounded-xl p-3 relative overflow-hidden transition-opacity \${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}\`}>`
);

content = content.replace(
  /<div className="mt-auto pt-6 flex flex-col justify-end min-h-\[160px\]">/,
  `<div className={\`mt-auto pt-6 flex flex-col justify-end min-h-[160px] transition-opacity \${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}\`}>`
);


// Update step-content div
content = content.replace(
  /<div className="step-content print:hidden">/,
  `<div className={\`step-content print:hidden relative transition-all duration-300 ease-in-out bg-white \${isContentCollapsed ? '!w-0 !p-0 overflow-hidden border-none' : ''}\`}>
        <button 
          onClick={() => setIsContentCollapsed(!isContentCollapsed)}
          className={\`absolute top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm z-50 text-gray-500 hover:text-gray-700 hidden md:block transition-all \${isContentCollapsed ? '-left-10' : '-left-3'}\`}
        >
          <svg className={\`w-4 h-4 transform transition-transform \${isContentCollapsed ? 'rotate-180' : ''}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={\`w-[392px] max-w-[100vw] h-full overflow-y-auto p-6 transition-opacity duration-200 \${isContentCollapsed ? 'opacity-0 invisible' : 'opacity-100'}\`}>`
);

// Close the inner wrapper div at the end of step-content
content = content.replace(
  /(\s*)<\/div>\s*<\/div>\s*\)\n\}/,
  `$1</div>\n      </div>\n    </div>\n  )\n}`
);


fs.writeFileSync('src/components/Editor/Editor.tsx', content);
