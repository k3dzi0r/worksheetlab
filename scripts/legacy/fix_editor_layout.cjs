const fs = require('fs');
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');

// 1. Fix step-nav collapse and structure
editor = editor.replace(
  /<nav className=\{\`step-nav relative transition-all duration-300 ease-in-out \$\{isNavCollapsed \? '!w-16 !px-2 overflow-hidden' : ''\}\`\}>/,
  `<nav className={\`step-nav relative transition-all duration-300 ease-in-out \${isNavCollapsed ? '!w-16' : ''}\`}>`
);

editor = editor.replace(
  /<header className="mb-5">/,
  `<div className={\`step-nav-inner transition-opacity \${isNavCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'}\`}>\n        <header className="mb-5">`
);

// find `</nav>` and insert `</div>` before it.
editor = editor.replace(
  /        <\/div>\n      <\/nav>\n\n      <div className=\{\`step-content/g,
  `        </div>\n      </div>\n      </nav>\n\n      <div className={\`step-content`
);

// We should remove all the `transition-opacity ${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}` from individual elements inside `step-nav-inner`
// since the whole `step-nav-inner` is now fading out!
editor = editor.replace(/transition-opacity \$\{isNavCollapsed \? 'opacity-0 whitespace-nowrap' : 'opacity-100'\}/g, "");
editor = editor.replace(/transition-opacity \$\{isNavCollapsed \? 'opacity-0 hidden' : 'opacity-100'\}/g, "");

// We also had `{isNavCollapsed ? 'justify-center' : ''}` in the buttons, but now the whole inner div is hidden, so we don't need to try to show buttons when collapsed! Wait!
// If `step-nav-inner` is `invisible`, you can't click the steps when it's collapsed!
// Ah! In my previous implementation, I wanted the step ICONS to be visible when collapsed, so you could switch steps!
// If `!w-16`, the width is small, but if I hide `step-nav-inner`, I hide the icons!

