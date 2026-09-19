const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Remove simpleMode from dependency arrays: `simpleMode,` or `, simpleMode`
      content = content.replace(/\s*simpleMode,\n/g, '\n');
      content = content.replace(/,\s*simpleMode\s*/g, '');

      // Replace simpleMode conditionals like `simpleMode ? '...' : '...'`
      content = content.replace(/simpleMode\s*\?\s*'([^']+)'\s*:\s*'([^']+)'/g, "'$2'");
      // Handle backticks (YesNoTemplate)
      content = content.replace(/simpleMode\s*\?\s*'([^']+)'\s*:\s*'([^']+)'/g, "'$2'");
      
      content = content.replace(/simpleMode\s*\?\s*(\d+)\s*:\s*(\d+)/g, '$2');

      // Remove simpleMode prop from interfaces
      content = content.replace(/\s*simpleMode\?:\s*boolean/g, '');
      content = content.replace(/\s*simpleMode:\s*boolean/g, '');

      // Remove from object destructs
      content = content.replace(/,\s*simpleMode\s*=\s*false/g, '');
      content = content.replace(/\bsimpleMode\s*=\s*false\s*,/g, '');
      content = content.replace(/\bsimpleMode\s*,/g, '');

      // CutCards
      content = content.replace(/const simpleModeMultiplier = 1\n/g, '');

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('src/templates');
processDir('src/components');
