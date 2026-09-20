const fs = require('fs');
let content = fs.readFileSync('src/templates/ChoiceTemplate.tsx', 'utf8');

content = content.replace(
  /simpleMode\?: boolean/,
  `simpleMode?: boolean\n  showCheckboxes?: boolean`
);

content = content.replace(
  /simpleMode = false \}: ChoiceTemplateProps/,
  `simpleMode = false, showCheckboxes = false }: ChoiceTemplateProps`
);

const checkboxBlock = `{showCheckboxes && <div className={\`border-4 border-gray-400 rounded-lg \${simpleMode ? 'w-12 h-12 mt-4' : 'w-8 h-8 mt-2'}\`} />}`;

content = content.replace(
  /<WorksheetItemView key=\{item\.id\} item=\{item\} baseScale=\{itemScale\} simpleMode=\{simpleMode\} \/>/g,
  `<div key={item.id} className="flex flex-col items-center">
              <WorksheetItemView item={item} baseScale={itemScale} simpleMode={simpleMode} />
              ${checkboxBlock}
            </div>`
);

content = content.replace(
  /<div\n                key=\{item\.id\}\n                className="absolute -translate-x-1\/2 -translate-y-1\/2"\n                style=\{\{ left: \`\$\{left\}%\`, top: \`\$\{top\}%\` \}\}\n              >\n                <div key=\{item\.id\} className="flex flex-col items-center">/g,
  `<div
                key={item.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: \`\${left}%\`, top: \`\${top}%\` }}
              >`
);

content = content.replace(
  /              <WorksheetItemView item=\{item\} baseScale=\{itemScale\} simpleMode=\{simpleMode\} \/>\n              \{showCheckboxes && <div className=\{\`border-4 border-gray-400 rounded-lg \$\{simpleMode \? 'w-12 h-12 mt-4' : 'w-8 h-8 mt-2'\}\`\} \/>\}\n            <\/div>\n              <\/div>/g,
  `              <WorksheetItemView item={item} baseScale={itemScale} simpleMode={simpleMode} />\n              ${checkboxBlock}\n              </div>`
);

fs.writeFileSync('src/templates/ChoiceTemplate.tsx', content);
