const fs = require('fs');
let mathTasks = fs.readFileSync('src/mathTasks.ts', 'utf8');

mathTasks = mathTasks.replace(/\/\*\* Dozwolone zakresy liczbowe[\s\S]*?export const MATH_RANGES = \[10, 20, 100\] as const\n\n/, '');

fs.writeFileSync('src/mathTasks.ts', mathTasks);
