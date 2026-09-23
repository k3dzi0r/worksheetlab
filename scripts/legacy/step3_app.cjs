const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const initialWorksheetProps = `  yesNoUseColors: false,
  choiceShowCheckboxes: false,
  matchPairsLineStyle: 'solid',
  countScattered: false,
  sequenceBlankStyle: 'underscore',
  cutCardsPerRow: 3,
  sameOrDifferentReferenceStyle: 'box',
  categorizeLayout: 'columns',`;

app = app.replace(
  /  correctAnswers: \[\],\n\}/,
  `  correctAnswers: [],\n${initialWorksheetProps}\n}`
);

// We need a generic handleUpdateOptions function
const handleOptions = `  function handleUpdateOptions(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }`;

app = app.replace(
  /  function handleCountRepetitionsChange/,
  `${handleOptions}\n\n  function handleCountRepetitionsChange`
);

// Pass onUpdateOptions to Editor
app = app.replace(
  /onInstructionChange=\{handleInstructionChange\}/,
  `onInstructionChange={handleInstructionChange}\n          onUpdateOptions={handleUpdateOptions}`
);

fs.writeFileSync('src/App.tsx', app);
