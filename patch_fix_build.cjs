const fs = require('fs');

// 1. CategorizeTemplate.tsx
let catTemplate = fs.readFileSync('src/templates/CategorizeTemplate.tsx', 'utf8');
const itemsDiv = `
      <div className="px-8 pb-8">
        <div className={\`flex flex-wrap justify-center items-center \${simpleMode ? 'gap-12' : 'gap-8'}\`}>
          {items.map((item) => (
            <WorksheetItemView key={item.id} item={item} baseScale={itemScale} simpleMode={simpleMode} />
          ))}
        </div>
      </div>
    </div>
  )
}
`;
catTemplate = catTemplate.replace(/    <\/div>\n  \)\n\}/, itemsDiv);
fs.writeFileSync('src/templates/CategorizeTemplate.tsx', catTemplate);

// 2. WorksheetPreview.tsx
let preview = fs.readFileSync('src/components/WorksheetPreview/WorksheetPreview.tsx', 'utf8');
preview = preview.replace(/import \{ OddOneOutTemplate \} from '\.\.\/\.\.\/templates\/OddOneOutTemplate'\n/, '');
// Might be imported from '../templates/OddOneOutTemplate'
preview = preview.replace(/import \{ OddOneOutTemplate \} from '\.\.\/templates\/OddOneOutTemplate'\n/, '');
fs.writeFileSync('src/components/WorksheetPreview/WorksheetPreview.tsx', preview);

// 3. CutCardsTemplate.tsx
let cutCards = fs.readFileSync('src/templates/CutCardsTemplate.tsx', 'utf8');
cutCards = cutCards.replace(/\/\*\* Liczba kolumn[\s\S]*?function gridColumns[\s\S]*?\}\n\n/, '');
fs.writeFileSync('src/templates/CutCardsTemplate.tsx', cutCards);

