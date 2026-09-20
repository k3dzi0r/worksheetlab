const fs = require('fs');

let types = fs.readFileSync('src/types/worksheet.ts', 'utf8');
types = types.replace(/mathMaxRange\?: number/, ''); // remove mathMaxRange
fs.writeFileSync('src/types/worksheet.ts', types);

let io = fs.readFileSync('src/worksheetIO.ts', 'utf8');
io = io.replace(/mathMaxRange,\n/, ''); // remove mathMaxRange from destructure
io = io.replace(/const legacyState = state as any\n  const instructionScale = typeof legacyState.instructionScale === 'number'\n    \? legacyState.instructionScale\n    : \(legacyState.simpleMode \? 1.25 : 1\)\n\n  const result = \{\n    \.\.\.state,\n    instructionScale,\n/, 
  `const legacyState = state as any
  const instructionScale = typeof legacyState.instructionScale === 'number'
    ? legacyState.instructionScale
    : (legacyState.simpleMode ? 1.25 : 1)

  const result = {
    ...state,
    instructionScale,
    mathMax: legacyState.mathMaxRange ? legacyState.mathMaxRange : legacyState.mathMax,
`);
fs.writeFileSync('src/worksheetIO.ts', io);

