const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(
  /\.step-nav-inner \{\n  display: flex;\n  flex-direction: column;\n  padding: 1\.25rem 1rem;\n  overflow-y: auto;\n  overflow-x: hidden;\n  height: 100%;\n\}/,
  `.step-nav-inner {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 0;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}`
);

fs.writeFileSync('src/index.css', css);
