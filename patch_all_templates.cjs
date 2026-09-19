const fs = require('fs');
const path = require('path');

const templatesDir = 'src/templates';
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove `simpleMode?: boolean` from interfaces
  content = content.replace(/\s*simpleMode\?:\s*boolean/g, '');
  
  // Remove `simpleMode = false` from props destruction
  // Regex looks for `simpleMode = false,` or `simpleMode = false`
  content = content.replace(/,\s*simpleMode\s*=\s*false/g, '');
  content = content.replace(/simpleMode\s*=\s*false\s*,/g, '');

  // Remove `simpleMode={simpleMode}` from component usages
  content = content.replace(/\bsimpleMode=\{simpleMode\}/g, '');
  
  // Replace simpleMode conditionals in template literals
  // e.g. `${simpleMode ? 'gap-8' : 'gap-5'}`
  // We'll just replace `${simpleMode ? 'X' : 'Y'}` with `Y` (the standard layout)
  // Wait, sometimes simpleMode is used to scale things. We can do regex match:
  content = content.replace(/\$\{simpleMode\s*\?\s*'([^']+)'\s*:\s*'([^']+)'\}/g, '$2');
  
  // Also replace simpleModeMultiplier logic
  content = content.replace(/const simpleModeMultiplier = simpleMode \? [\d.]+ : 1/g, '');
  content = content.replace(/\s*\* simpleModeMultiplier/g, '');

  // If there's `instruction={instruction} simpleMode={simpleMode}` -> we should add instructionScale if we need to, but InstructionText no longer needs simpleMode! It uses instructionScale, but it defaults to 1. In WorksheetPreview we can just pass instructionScale directly to InstructionText, wait, InstructionText is rendered INSIDE templates!
  // So templates need to receive instructionScale and pass it to InstructionText!
  // Wow, yes!
}
