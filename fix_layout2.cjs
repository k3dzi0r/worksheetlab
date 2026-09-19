const fs = require('fs');
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

// 1. Remove overflow-hidden from step-nav
editor = editor.replace(
  /<nav className=\{\`step-nav relative transition-all duration-300 ease-in-out \$\{isNavCollapsed \? '!w-16 !px-2 overflow-hidden' : ''\}\`\}>/,
  `<nav className={\`step-nav relative transition-all duration-300 ease-in-out \${isNavCollapsed ? '!w-16 !px-0 border-r-0' : ''}\`}>`
);

// 2. Add step-nav-inner wrapper after the button
editor = editor.replace(
  /          <\/svg>\n        <\/button>\n        <header className="mb-5">/,
  `          </svg>\n        </button>\n        <div className="step-nav-inner custom-scrollbar h-full flex flex-col">\n        <header className="mb-5 px-4">`
);

// Fix padding for steps inside step-nav-inner when collapsed
editor = editor.replace(/<ol className="flex flex-col gap-2">/, `<ol className="flex flex-col gap-2 px-2">`);
editor = editor.replace(/<div className=\{\`mt-6/g, `<div className={\`mt-6 px-4`);
editor = editor.replace(/<div className=\{\`mt-auto/g, `<div className={\`mt-auto px-4`);

// 3. Close step-nav-inner before </nav>
editor = editor.replace(
  /        <\/div>\n      <\/nav>\n\n      <div className=\{\`step-content/,
  `        </div>\n        </div>\n      </nav>\n\n      <div className={\`step-content`
);

// 4. step-content: remove overflow-hidden
editor = editor.replace(
  /<div className=\{\`step-content relative transition-all duration-300 ease-in-out bg-white \$\{isContentCollapsed \? '!w-0 overflow-hidden border-none' : ''\}\`\}>/,
  `<div className={\`step-content relative transition-all duration-300 ease-in-out bg-white \${isContentCollapsed ? '!w-0 border-none' : ''}\`}>`
);


fs.writeFileSync('src/components/Editor/Editor.tsx', editor);
