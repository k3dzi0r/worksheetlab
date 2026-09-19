const fs = require('fs');
let content = fs.readFileSync('src/templates/SequenceTemplate.tsx', 'utf8');

content = content.replace(
  /simpleMode\?: boolean/,
  `simpleMode?: boolean\n  blankStyle?: 'underscore' | 'box'`
);

content = content.replace(
  /itemScale,\n  simpleMode = false,\n\}: SequenceTemplateProps\)/,
  `itemScale,\n  simpleMode = false,\n  blankStyle = 'underscore',\n}: SequenceTemplateProps)`
);

const blankRender = `<div
              key={\`blank-\${index}\`}
              className={blankStyle === 'box' ? "border-4 border-dashed border-gray-400 rounded-xl" : "border-b-4 border-gray-500"}
              style={{ width: blankDimension, height: blankStyle === 'box' ? blankDimension : '0.5rem', alignSelf: blankStyle === 'underscore' ? 'flex-end' : 'auto', marginBottom: blankStyle === 'underscore' ? '1rem' : '0' }}
            />`;

content = content.replace(
  /<div\n\s*key=\{`blank-\$\{index\}`\}\n\s*className="border-4 border-dashed border-gray-400 rounded-xl"\n\s*style=\{\{ width: blankDimension, height: blankDimension \}\}\n\s*\/>/m,
  blankRender
);

fs.writeFileSync('src/templates/SequenceTemplate.tsx', content);
