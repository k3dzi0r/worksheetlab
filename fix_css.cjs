const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(
  /\.step-nav \{\n  width: 224px;\n  flex-shrink: 0;\n  display: flex;\n  flex-direction: column;\n  padding: 1\.25rem 1rem;\n  border-right: 1px solid #f1f5f9;\n  background: #fafafa;\n  overflow-y: auto;\n\}/,
  `.step-nav {
  width: 224px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f1f5f9;
  background: #fafafa;
}

.step-nav-inner {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}`
);

// also fix mobile step-nav
css = css.replace(
  /\.step-nav \{\n    width: 100% !important;\n    max-height: 140px;\n    overflow-y: auto !important;\n    border-bottom: 1px solid #f1f5f9;\n  \}/,
  `.step-nav {
    width: 100% !important;
    max-height: 140px;
    border-bottom: 1px solid #f1f5f9;
  }
  .step-nav-inner {
    overflow-y: auto !important;
    padding: 0.5rem;
  }`
);

fs.writeFileSync('src/index.css', css);
