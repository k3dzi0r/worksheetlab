const fs = require('fs');
let io = fs.readFileSync('src/worksheetIO.ts', 'utf8');

// Convert oddOneOut to choice before template validation
const replaceLogic = `  if (state.template === 'oddOneOut') {
    state.template = 'choice';
    state.layout = 'row';
  }

  if (typeof state.template !== 'string' || !VALID_TEMPLATES.includes(state.template as TemplateType)) return null`;

io = io.replace(/  if \(typeof state\.template !== 'string' \|\| !VALID_TEMPLATES\.includes\(state\.template as TemplateType\)\) return null/, replaceLogic);

// Remove 'oddOneOut' from VALID_TEMPLATES array
io = io.replace(/\s*'oddOneOut',/, '');

fs.writeFileSync('src/worksheetIO.ts', io);
