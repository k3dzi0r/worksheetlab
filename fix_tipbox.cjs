const fs = require('fs');
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

editor = editor.replace(
  /mt-6 px-4 bg-blue-50 border border-blue-200 rounded-xl p-3 relative overflow-hidden transition-opacity/,
  `mt-6 px-4 shrink-0 bg-blue-50 border border-blue-200 rounded-xl p-3 relative overflow-hidden transition-opacity`
);

editor = editor.replace(
  /mt-auto px-4 pt-6 flex flex-col justify-end min-h-\[160px\] transition-opacity/,
  `mt-auto px-4 pt-6 shrink-0 flex flex-col justify-end min-h-[160px] transition-opacity`
);

fs.writeFileSync('src/components/Editor/Editor.tsx', editor);
