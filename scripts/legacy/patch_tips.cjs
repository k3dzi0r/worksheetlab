const fs = require('fs');
let content = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

content = content.replace(/bg-amber-50/g, 'bg-blue-50');
content = content.replace(/border-amber-200/g, 'border-blue-200');
content = content.replace(/text-amber-500/g, 'text-blue-500');
content = content.replace(/text-amber-900/g, 'text-blue-900');
content = content.replace(/text-amber-800/g, 'text-blue-800');

fs.writeFileSync('src/components/Editor/Editor.tsx', content);
