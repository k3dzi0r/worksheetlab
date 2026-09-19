const fs = require('fs');

// App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/, 'oddOneOut'/g, '');
app = app.replace(/ \|\| template === 'oddOneOut'/g, '');
app = app.replace(/ \|\| prev\.template === 'oddOneOut'/g, '');
app = app.replace(/"choice" i "oddOneOut"/g, '"choice"');
fs.writeFileSync('src/App.tsx', app);

// WorksheetPreview.tsx
let preview = fs.readFileSync('src/components/WorksheetPreview/WorksheetPreview.tsx', 'utf8');
preview = preview.replace(/import \{ OddOneOutTemplate \} from '\.\.\/templates\/OddOneOutTemplate'\n/, '');
preview = preview.replace(/\s*\{worksheet\.template === 'oddOneOut' && \([\s\S]*?\)\}/, '');
fs.writeFileSync('src/components/WorksheetPreview/WorksheetPreview.tsx', preview);

// Editor.tsx
let editor = fs.readFileSync('src/components/Editor/Editor.tsx', 'utf8');
editor = editor.replace(/, 'oddOneOut'/g, '');
fs.writeFileSync('src/components/Editor/Editor.tsx', editor);

// TemplateThumbnail.tsx
let thumb = fs.readFileSync('src/components/Editor/TemplateThumbnail.tsx', 'utf8');
thumb = thumb.replace(/\s*oddOneOut:\s*\([\s\S]*?<\/>\s*\),/m, '');
fs.writeFileSync('src/components/Editor/TemplateThumbnail.tsx', thumb);

// Delete OddOneOutTemplate.tsx
if (fs.existsSync('src/templates/OddOneOutTemplate.tsx')) {
  fs.unlinkSync('src/templates/OddOneOutTemplate.tsx');
}
