const fs = require('fs');
let task = fs.readFileSync('/Users/adriankedzior/.gemini/antigravity/brain/700f9640-5891-4d5a-9952-5794dc678392/task.md', 'utf8');

task = task.replace(/- \[ \] 4/g, '- [x] 4');
task = task.replace(/- \[ \] Zmiana klas Tailwind/g, '- [x] Zmiana klas Tailwind');

task = task.replace(/- \[ \] 5/g, '- [x] 5');
task = task.replace(/- \[ \] Zmiana stanu w/g, '- [x] Zmiana stanu w');
task = task.replace(/- \[ \] Dodanie przycisków/g, '- [x] Dodanie przycisków');
task = task.replace(/- \[ \] Klasy CSS/g, '- [x] Klasy CSS');

task = task.replace(/- \[ \] 6/g, '- [x] 6');
task = task.replace(/- \[ \] Sticky nawigacja/g, '- [x] Sticky nawigacja');
task = task.replace(/- \[ \] Przystosowanie `step-content`/g, '- [x] Przystosowanie `step-content`');

fs.writeFileSync('/Users/adriankedzior/.gemini/antigravity/brain/700f9640-5891-4d5a-9952-5794dc678392/task.md', task);
