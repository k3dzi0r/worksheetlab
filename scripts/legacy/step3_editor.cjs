const fs = require('fs');
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

editor = editor.replace(
  /  onInstructionChange: \(instruction: string\) => void/,
  `  onInstructionChange: (instruction: string) => void\n  onUpdateOptions: (options: Partial<WorksheetState>) => void`
);

editor = editor.replace(
  /  onInstructionChange,\n/,
  `  onInstructionChange,\n  onUpdateOptions,\n`
);

fs.writeFileSync('src/components/Editor/Editor.tsx', editor);
