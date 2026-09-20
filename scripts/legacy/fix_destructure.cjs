const fs = require('fs');
const path = require('path');

const templatesDir = 'src/templates';
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // If there's an instructionScale passed to InstructionText, make sure it's in the function props.
  if (content.includes('instructionScale={instructionScale}')) {
    // add to props destruct
    if (!content.includes('instructionScale = 1')) {
       // Find `instruction,` and add `instructionScale = 1,`
       content = content.replace(/instruction,/g, 'instruction,\n  instructionScale = 1,');
    }
  }
  
  fs.writeFileSync(filePath, content);
}
