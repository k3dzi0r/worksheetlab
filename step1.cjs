const fs = require('fs');

// 1. index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/WorksheetLab/g, 'KartoLab');
fs.writeFileSync('index.html', html);

// 2. Editor.tsx
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');
editor = editor.replace(/WorksheetLab/g, 'KartoLab');
editor = editor.replace(/<img src=\{`\$\{import.meta.env.BASE_URL\}illustrations\/pencil.webp`\} alt="" className="w-24 opacity-90 hidden 2xl:block self-center mb-4" aria-hidden="true" \/>\s*/g, '');
fs.writeFileSync('src/components/Editor/Editor.tsx', editor);

// 3. sw.js
let sw = fs.readFileSync('public/sw.js', 'utf8');
sw = sw.replace(/\s*'\/worksheetlab\/illustrations\/pencil\.webp',/, '');
fs.writeFileSync('public/sw.js', sw);

// 4. Delete the file
if (fs.existsSync('public/illustrations/pencil.webp')) {
  fs.unlinkSync('public/illustrations/pencil.webp');
}
