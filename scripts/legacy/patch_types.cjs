const fs = require('fs');

let types = fs.readFileSync('src/types/worksheet.ts', 'utf8');

// Replace simpleMode with instructionScale
types = types.replace(
  /\/\*\* Tryb prosty: większe polecenie, elementy i odstępy, dla lepszej czytelności\. \*\/\n  simpleMode: boolean/,
  `/** Skala wielkości polecenia (np. 1.0 = domyślny rozmiar) */\n  instructionScale: number`
);

fs.writeFileSync('src/types/worksheet.ts', types);
