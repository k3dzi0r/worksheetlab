const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(
  /\.step-nav > nav \{/g,
  `.step-nav-inner > ol {`
);

css = css.replace(
  /\.step-nav > nav > button \{/g,
  `.step-nav-inner > ol > li > button {`
);

css = css.replace(
  /\.step-nav > nav > button > div:nth-child\(2\) \{/g,
  `.step-nav-inner > ol > li > button > span:nth-child(2) {`
);

// We should hide the header on mobile?
css = css.replace(
  /\.step-nav-inner > ol \{/,
  `.step-nav-inner > header {\n    display: none;\n  }\n  .step-nav-inner > ol {`
);

// We should also hide the Quick Options, Actions, and Tip on mobile since they take up too much vertical space and are basically useless when trying to edit the content?
// Or we can let them scroll horizontally? No, they are vertically stacked.
// If we just leave them vertically stacked, they will take space. The user wants step-nav to be sticky horizontally.
// Let's just hide everything except the steps on mobile for now? Or maybe put them in a horizontal layout?
// Let's just hide the footer on mobile for sure.
css = css.replace(
  /\.step-nav-inner > ol \{/,
  `.step-nav-inner > div.mt-auto {\n    display: none;\n  }\n  .step-nav-inner > ol {`
);

fs.writeFileSync('src/index.css', css);
