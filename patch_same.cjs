const fs = require('fs');
let content = fs.readFileSync('src/templates/SameOrDifferentTemplate.tsx', 'utf8');

content = content.replace(
  /simpleMode\?: boolean/,
  `simpleMode?: boolean\n  referenceStyle?: 'box' | 'underline' | 'none'`
);

content = content.replace(
  /itemScale, simpleMode = false \}: SameOrDifferentTemplateProps\)/,
  `itemScale, simpleMode = false, referenceStyle = 'box' }: SameOrDifferentTemplateProps)`
);

const referenceClasses = "`${referenceStyle === 'box' ? 'border-2 border-gray-800 rounded-xl px-8 py-6' : referenceStyle === 'underline' ? 'border-b-4 border-gray-800 pb-4 px-4' : 'px-8 py-6'} min-w-[6rem] min-h-[6rem] flex items-center justify-center`";

content = content.replace(
  /className="border-2 border-gray-800 rounded-xl px-8 py-6 min-w-\[6rem\] min-h-\[6rem\] flex items-center justify-center"/,
  `className={${referenceClasses}}`
);

fs.writeFileSync('src/templates/SameOrDifferentTemplate.tsx', content);
