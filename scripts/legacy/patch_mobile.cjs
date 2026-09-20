const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const mobileCSS = `@media (max-width: 900px) {
  .app-layout {
    flex-direction: column;
    height: auto;
  }
  .editor-panel {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .editor-shell {
    flex-direction: column;
  }

  .step-nav {
    width: 100% !important;
    max-height: 140px;
    overflow-y: auto !important;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .step-nav > nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  .step-nav > nav > button {
    flex-shrink: 0;
    width: auto;
    flex-direction: column;
    text-align: center;
  }
  
  .step-nav > nav > button > div:nth-child(2) {
    display: none;
  }

  .step-content {
    width: 100% !important;
    height: 60vh;
  }
  
  .step-content > div:last-child {
    width: 100% !important;
  }

  .preview-panel {
    height: auto;
    overflow: visible;
  }
}`;

css = css.replace(
  /@media \(max-width: 900px\) \{[\s\S]*?\.preview-panel \{[\s\S]*?\}\n\}/,
  mobileCSS
);

fs.writeFileSync('src/index.css', css);
