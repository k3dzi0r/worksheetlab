const fs = require('fs');
let content = fs.readFileSync('src/templates/CutCardsTemplate.tsx', 'utf8');
content = content.replace(/const SIMPLE_MODE_SCALE = 1.35\n/, '');
fs.writeFileSync('src/templates/CutCardsTemplate.tsx', content);
