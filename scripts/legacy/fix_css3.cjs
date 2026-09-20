const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/height: 100%;\n\}/, 'flex: 1;\n}');
fs.writeFileSync('src/index.css', css);
