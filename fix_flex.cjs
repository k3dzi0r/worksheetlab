const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Ensure editor-panel uses flex so editor-shell can flex
css = css.replace(
  /\.editor-panel \{\n  flex-shrink: 0;\n  border-right: 1px solid #e5e7eb;\n  background: #ffffff;\n  height: 100vh;\n\}/,
  `.editor-panel {
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  height: 100vh;
  display: flex;
  flex-direction: column;
}`
);

// Add min-height: 0 to editor-shell, step-nav, step-content
css = css.replace(
  /\.editor-shell \{\n  display: flex;\n  flex: 1;\n\}/,
  `.editor-shell {
  display: flex;
  flex: 1;
  min-height: 0;
}`
);

css = css.replace(
  /\.step-nav \{\n  width: 224px;\n  flex-shrink: 0;\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid #f1f5f9;\n  background: #fafafa;\n\}/,
  `.step-nav {
  width: 224px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f1f5f9;
  background: #fafafa;
  min-height: 0;
}`
);

fs.writeFileSync('src/index.css', css);
