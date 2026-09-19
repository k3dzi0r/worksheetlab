const fs = require('fs');

// 1. types/worksheet.ts
let types = fs.readFileSync('src/types/worksheet.ts', 'utf8');
types = types.replace(
  /  \/\*\* Tryb prosty: większe polecenie, elementy i odstępy, dla lepszej czytelności\. \*\/\n  simpleMode: boolean/,
  `  /** Skala wielkości polecenia (np. 1.0 = domyślny rozmiar) */
  instructionScale: number`
);
types = types.replace(
  /  mathRange\?: '10' \| '20' \| '100'/,
  `  mathMaxRange?: number`
);
fs.writeFileSync('src/types/worksheet.ts', types);


// 2. worksheetIO.ts
let io = fs.readFileSync('src/worksheetIO.ts', 'utf8');

const ioPatch = `
  const legacyState = state as any
  let mathMaxRange = legacyState.mathMaxRange
  if (legacyState.mathRange) {
    mathMaxRange = parseInt(legacyState.mathRange, 10) || 10
  }

  const instructionScale = typeof legacyState.instructionScale === 'number'
    ? legacyState.instructionScale
    : (legacyState.simpleMode ? 1.25 : 1)

  return {
    ...state,
    instructionScale,
    mathMaxRange,
`;

io = io.replace(/  return \{\n    \.\.\.state,/, ioPatch);

// Ensure we don't return simpleMode in normalized state (though spread takes everything, it's fine if it's there temporarily, but let's delete them).
const deleteOldKeys = `
  const result = {
    ...state,
    instructionScale,
    mathMaxRange,
`;
io = io.replace(ioPatch, deleteOldKeys);

const returnResult = `
  delete (result as any).simpleMode;
  delete (result as any).mathRange;

  return result as unknown as WorksheetState
}`;

io = io.replace(/  \} as unknown as WorksheetState\n\}/, returnResult);

fs.writeFileSync('src/worksheetIO.ts', io);
