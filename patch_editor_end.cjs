const fs = require('fs');
let content = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

content = content.replace(
  /(\s*)<\/Step>\n(\s*)<\/div>\n(\s*)<\/div>\n(\s*)\)\n\}/,
  `$1</Step>\n$2</div>\n$2</div>\n$3</div>\n$4)\n}`
);

fs.writeFileSync('src/components/Editor/Editor.tsx', content);
