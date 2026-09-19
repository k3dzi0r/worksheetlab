const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(
  /\.step-content \{\n  width: 392px;\n  flex-shrink: 0;\n\}/,
  `.step-content {
  width: 392px;
  flex-shrink: 0;
  min-height: 0;
}`
);

fs.writeFileSync('src/index.css', css);
