const fs = require('fs');
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

// Change step-content arrow to top-16
editor = editor.replace(
  /className=\{\`absolute top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm z-50 text-gray-500 hover:text-gray-700 hidden md:block transition-all \$\{isContentCollapsed \? '-left-8' : '-left-3'\}\`\}/,
  `className={\`absolute top-16 bg-white border border-gray-200 rounded-full p-1 shadow-sm z-50 text-gray-500 hover:text-gray-700 hidden md:block transition-all \${isContentCollapsed ? '-left-8' : '-left-3'}\`}`
);

fs.writeFileSync('src/components/Editor/Editor.tsx', editor);
