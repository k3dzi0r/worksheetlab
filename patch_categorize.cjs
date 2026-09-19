const fs = require('fs');
let content = fs.readFileSync('src/templates/CategorizeTemplate.tsx', 'utf8');

content = content.replace(
  /simpleMode\?: boolean/,
  `simpleMode?: boolean\n  layout?: 'columns' | 'areas'`
);

content = content.replace(
  /simpleMode = false \}: CategorizeTemplateProps\)/,
  `simpleMode = false, layout = 'columns' }: CategorizeTemplateProps)`
);

const renderAreas = `
      {layout === 'columns' ? (
        <div className="flex w-full px-8 gap-0 flex-1 min-h-[30%]">
          {categories.map((category, index) => (
            <div key={index} className={\`flex-1 flex flex-col items-center border-gray-800 \${index === 0 ? 'border-l-2' : ''} border-r-2 border-t-2 border-b-2\`}>
              <h2 className={\`font-bold py-4 text-center w-full border-b-2 border-gray-800 bg-gray-50 \${simpleMode ? 'text-3xl' : 'text-xl'}\`}>
                {category}
              </h2>
              <div className="w-full flex-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex w-full px-8 gap-8 flex-1 min-h-[30%]">
          {categories.map((category, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <h2 className={\`font-bold mb-4 text-center \${simpleMode ? 'text-3xl' : 'text-xl'}\`}>
                {category}
              </h2>
              <div className="w-full flex-1 border-2 border-dashed border-gray-400 rounded-[50px]" />
            </div>
          ))}
        </div>
      )}
`;

content = content.replace(
  /<div className="flex w-full px-8 gap-4 flex-1 min-h-\[30%\]">[\s\S]*?<\/div>\s*<\/div>/,
  renderAreas
);

fs.writeFileSync('src/templates/CategorizeTemplate.tsx', content);
