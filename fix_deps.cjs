const fs = require('fs');
const path = require('path');

const templatesDir = 'src/templates';
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove `instructionScale = 1,` from `usePageSpace([ ... ])`
  // We can just find `instruction,\n  instructionScale = 1,` inside `usePageSpace` but since it's hard, 
  // let's just do a regex replace for `instructionScale = 1,` that doesn't have an equal sign around it.
  // Actually, inside an array, it's `instructionScale = 1,`. We can just change it back to `instructionScale,`
  // Wait, `instructionScale` inside dependency array should just be `instructionScale,`
  
  content = content.replace(/usePageSpace\(\[([\s\S]*?)\]\)/g, (match, p1) => {
     return `usePageSpace([${p1.replace(/instructionScale = 1,/g, 'instructionScale,')}])`;
  });

  fs.writeFileSync(filePath, content);
}
