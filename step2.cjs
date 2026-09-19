const fs = require('fs');

let types = fs.readFileSync('src/types/worksheet.ts', 'utf8');
types = types.replace(/ \| 'oddOneOut'/g, '');

const optionsRegex = /,\s*\{\s*value:\s*'oddOneOut',\s*label:\s*'Co nie pasuje\?',\s*description:\s*'Kilka elementów, uczeń wskazuje ten niepasujący\.',\s*category:\s*'puzzles',\s*\}/g;
types = types.replace(optionsRegex, '');

fs.writeFileSync('src/types/worksheet.ts', types);
