const fs = require('fs');
let content = fs.readFileSync('src/templates/CountTemplate.tsx', 'utf8');

content = content.replace(
  /simpleMode\?: boolean/,
  `simpleMode?: boolean\n  scattered?: boolean`
);

content = content.replace(
  /itemScale, simpleMode = false \}: CountTemplateProps\)/,
  `itemScale, simpleMode = false, scattered = false }: CountTemplateProps)`
);

content = content.replace(
  /import \{ InstructionText \}/,
  `import { hashToUnit } from '../utils'\nimport { InstructionText }`
);

const scatteredRender = `
        {item && scattered ? (
          <div className="relative w-full h-full flex-1">
            {Array.from({ length: repetitions }).map((_, index) => {
              const left = 10 + hashToUnit(\`count-x-\${index}\`) * 80;
              const top = 10 + hashToUnit(\`count-y-\${index}\`) * 80;
              return (
                <div key={\`\${item.id}-\${index}\`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: \`\${left}%\`, top: \`\${top}%\` }}>
                  <WorksheetItemView item={item} baseScale={itemScale} simpleMode={simpleMode} />
                </div>
              );
            })}
          </div>
        ) : item && !scattered ? (
          <div className={\`flex flex-wrap justify-center items-center flex-1 \${simpleMode ? 'gap-9' : 'gap-6'}\`}>
            {Array.from({ length: repetitions }).map((_, index) => (
              <WorksheetItemView key={\`\${item.id}-\${index}\`} item={item} baseScale={itemScale} simpleMode={simpleMode} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Wybierz element do powielenia.</p>
        )}`;

content = content.replace(
  /<div className=\{\`flex flex-wrap justify-center items-center flex-1 \$\{simpleMode \? 'gap-9' : 'gap-6'\}\`\}>[\s\S]*?<\/div>/,
  scatteredRender
);

fs.writeFileSync('src/templates/CountTemplate.tsx', content);
