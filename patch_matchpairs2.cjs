const fs = require('fs');
let content = fs.readFileSync('src/templates/MatchPairsTemplate.tsx', 'utf8');

content = content.replace(
  /simpleMode\?: boolean/,
  `simpleMode?: boolean\n  lineStyle?: 'solid' | 'dashed' | 'dotted'`
);

content = content.replace(
  /itemScale,\n  simpleMode = false,\n\}: MatchPairsTemplateProps\)/,
  `itemScale,\n  simpleMode = false,\n  lineStyle = 'solid',\n}: MatchPairsTemplateProps)`
);

const centralLine = `{lineStyle !== 'none' && <div className={\`w-0 border-l-2 border-gray-300 \${lineStyle === 'dashed' ? 'border-dashed' : lineStyle === 'dotted' ? 'border-dotted' : ''}\`} />}`

content = content.replace(
  /<div className="flex-1" \/>/,
  `<div className="flex-1 flex justify-center py-4">
          <div className={\`w-0 border-l-2 border-gray-300 \${lineStyle === 'dashed' ? 'border-dashed' : lineStyle === 'dotted' ? 'border-dotted' : 'border-solid'}\`} />
        </div>`
);

fs.writeFileSync('src/templates/MatchPairsTemplate.tsx', content);
