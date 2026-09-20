const fs = require('fs');
let content = fs.readFileSync('src/templates/YesNoTemplate.tsx', 'utf8');

content = content.replace(
  /itemScale: number\n  simpleMode\?: boolean/,
  `itemScale: number\n  simpleMode?: boolean\n  useColors?: boolean`
);

content = content.replace(
  /itemScale, simpleMode = false \}: YesNoTemplateProps\)/,
  `itemScale, simpleMode = false, useColors = false }: YesNoTemplateProps)`
);

content = content.replace(
  /className=\{\`flex items-center justify-center border-4 border-gray-800 rounded-2xl font-bold text-gray-900 \$\{/g,
  `className={\`flex items-center justify-center border-4 \${useColors ? 'border-green-600 text-green-700 bg-green-50' : 'border-gray-800 text-gray-900'} rounded-2xl font-bold \${`
);

content = content.replace(
  /className=\{\`flex items-center justify-center border-4 \$\{useColors \? 'border-green-600 text-green-700 bg-green-50' : 'border-gray-800 text-gray-900'\} rounded-2xl font-bold \$\{\n\s*simpleMode \? 'w-56 h-28 text-4xl' : 'w-44 h-24 text-3xl'\n\s*\}\`\}\n\s*>\n\s*NIE/,
  `className={\`flex items-center justify-center border-4 \${useColors ? 'border-red-600 text-red-700 bg-red-50' : 'border-gray-800 text-gray-900'} rounded-2xl font-bold \${\n            simpleMode ? 'w-56 h-28 text-4xl' : 'w-44 h-24 text-3xl'\n          }\`}\n        >\n          NIE`
);

fs.writeFileSync('src/templates/YesNoTemplate.tsx', content);
