const fs = require('fs');
let content = fs.readFileSync('src/templates/MatchPairsTemplate.tsx', 'utf8');

content = content.replace(
  /simpleMode\?: boolean/,
  `simpleMode?: boolean\n  lineStyle?: 'solid' | 'dashed' | 'dotted'`
);

content = content.replace(
  /itemScale, simpleMode = false \}: MatchPairsTemplateProps\)/,
  `itemScale, simpleMode = false, lineStyle = 'solid' }: MatchPairsTemplateProps)`
);

// We need to inject styles into the dashed line or whatever line is drawn.
// In MatchPairsTemplate there are lines? Wait, there are no lines drawn yet! The student draws them!
// Maybe it renders points? Let's check the code first.
