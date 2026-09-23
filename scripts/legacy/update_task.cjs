const fs = require('fs');
let task = fs.readFileSync('/Users/adriankedzior/.gemini/antigravity/brain/700f9640-5891-4d5a-9952-5794dc678392/task.md', 'utf8');

task = task.replace(/- \[ \] 1/g, '- [x] 1');
task = task.replace(/- \[ \] Zmiana nazwy/g, '- [x] Zmiana nazwy');
task = task.replace(/- \[ \] Usunięcie `pencil.webp`/g, '- [x] Usunięcie `pencil.webp`');

task = task.replace(/- \[ \] 2/g, '- [x] 2');
task = task.replace(/- \[ \] Aktualizacja `TEMPLATE_OPTIONS`/g, '- [x] Aktualizacja `TEMPLATE_OPTIONS`');
task = task.replace(/- \[ \] Aktualizacja `parseProjectJson`/g, '- [x] Aktualizacja `parseProjectJson`');
task = task.replace(/- \[ \] Usunięcie pliku/g, '- [x] Usunięcie pliku');

task = task.replace(/- \[ \] 3/g, '- [x] 3');
task = task.replace(/- \[ \] Dodanie interfejsów/g, '- [x] Dodanie interfejsów');
task = task.replace(/- \[ \] Aktualizacja `Editor.tsx` o interfejsy/g, '- [x] Aktualizacja `Editor.tsx` o interfejsy');
task = task.replace(/- \[ \] Tak\/Nie/g, '- [x] Tak/Nie');
task = task.replace(/- \[ \] Wybierz/g, '- [x] Wybierz');
task = task.replace(/- \[ \] Połącz w pary/g, '- [x] Połącz w pary');
task = task.replace(/- \[ \] Policz/g, '- [x] Policz');
task = task.replace(/- \[ \] Sekwencja/g, '- [x] Sekwencja');
task = task.replace(/- \[ \] Kartoniki/g, '- [x] Kartoniki');
task = task.replace(/- \[ \] Taki sam\/inny/g, '- [x] Taki sam/inny');
task = task.replace(/- \[ \] Kategorie/g, '- [x] Kategorie');

fs.writeFileSync('/Users/adriankedzior/.gemini/antigravity/brain/700f9640-5891-4d5a-9952-5794dc678392/task.md', task);
