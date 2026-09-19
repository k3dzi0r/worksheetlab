const fs = require('fs');
const path = require('path');

const templatesDir = 'src/templates';
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add instructionScale to Props if instruction is there
  if (content.includes('instruction: string')) {
    content = content.replace(/instruction: string/, 'instruction: string\n  instructionScale?: number');
  }

  // Add instructionScale to destruction
  // We'll look for `({ instruction, ` and replace with `({ instruction, instructionScale = 1, `
  content = content.replace(/\{ instruction,/g, '{ instruction, instructionScale = 1,');

  // Replace <InstructionText instruction={instruction} ... /> with <InstructionText instruction={instruction} instructionScale={instructionScale} />
  content = content.replace(/<InstructionText instruction=\{instruction\}[\s\S]*?\/>/g, '<InstructionText instruction={instruction} instructionScale={instructionScale} />');


  // Remove `simpleMode?: boolean` from interfaces
  content = content.replace(/\s*simpleMode\?:\s*boolean/g, '');
  
  // Remove `simpleMode = false` from props destruction
  content = content.replace(/,\s*simpleMode\s*=\s*false/g, '');
  content = content.replace(/simpleMode\s*=\s*false\s*,/g, '');

  // Remove `simpleMode={simpleMode}` from component usages
  content = content.replace(/\bsimpleMode=\{simpleMode\}/g, '');
  
  // Replace simpleMode conditionals in template literals
  // e.g. `${simpleMode ? 'gap-8' : 'gap-5'}`
  // We'll just replace `${simpleMode ? 'X' : 'Y'}` with `Y` (the standard layout)
  content = content.replace(/\$\{simpleMode\s*\?\s*'([^']+)'\s*:\s*'([^']+)'\}/g, '$2');
  
  // Also replace simpleModeMultiplier logic
  content = content.replace(/\s*const simpleModeMultiplier = simpleMode \? [\d.]+ : 1/g, '');
  content = content.replace(/\s*\* simpleModeMultiplier/g, '');

  fs.writeFileSync(filePath, content);
}
