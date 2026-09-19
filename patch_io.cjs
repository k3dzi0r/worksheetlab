const fs = require('fs');

let io = fs.readFileSync('src/worksheetIO.ts', 'utf8');

const ioPatch = `
  const legacyState = state as any
  const instructionScale = typeof legacyState.instructionScale === 'number'
    ? legacyState.instructionScale
    : (legacyState.simpleMode ? 1.25 : 1)

  const result = {
    ...state,
    instructionScale,
`;

io = io.replace(/  return \{\n    \.\.\.state,/, ioPatch);

const returnResult = `
  delete (result as any).simpleMode;

  return result as unknown as WorksheetState
}`;

io = io.replace(/  \} as unknown as WorksheetState\n\}/, returnResult);

fs.writeFileSync('src/worksheetIO.ts', io);
