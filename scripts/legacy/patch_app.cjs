const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/simpleMode: false,/, 'instructionScale: 1,');

app = app.replace(/function getMaxItems\(template: TemplateType, simpleMode: boolean\): number \| null \{[\s\S]*?\n\}/, `function getMaxItems(template: TemplateType): number | null {
  if (template === 'choice' || template === 'cutCards' || template === 'categorize') return 12;
  if (template === 'sameOrDifferent') return 13;
  if (template === 'matchPairs') return 6;
  return null;
}`);

app = app.replace(/const limit = getMaxItems\(worksheet\.template, worksheet\.simpleMode\)/g, 'const limit = getMaxItems(worksheet.template)');

app = app.replace(/, simpleMode: prev\.simpleMode /, ', instructionScale: prev.instructionScale ');

app = app.replace(/  function handleSimpleModeChange\(simpleMode: boolean\) \{\n    setWorksheet\(\(prev\) => \(\{ \.\.\.prev, simpleMode \}\)\)\n  \}/, '');

app = app.replace(/onSimpleModeChange=\{handleSimpleModeChange\}/, '');

app = app.replace(/          simpleMode: worksheet\.simpleMode,/, '          instructionScale: worksheet.instructionScale,');

fs.writeFileSync('src/App.tsx', app);
