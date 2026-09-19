const fs = require('fs');
let content = fs.readFileSync('src/templates/CutCardsTemplate.tsx', 'utf8');

content = content.replace(
  /simpleMode\?: boolean/,
  `simpleMode?: boolean\n  cardsPerRow?: number`
);

content = content.replace(
  /showBorder, simpleMode = false \}: CutCardsTemplateProps\)/,
  `showBorder, simpleMode = false, cardsPerRow = 3 }: CutCardsTemplateProps)`
);

content = content.replace(
  /const columns = gridColumns\(items\.length\)/,
  `const columns = cardsPerRow; // removed gridColumns fallback as it's explicit now`
);

fs.writeFileSync('src/templates/CutCardsTemplate.tsx', content);
