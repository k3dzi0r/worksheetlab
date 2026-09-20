const fs = require('fs');
let content = fs.readFileSync('src/components/WorksheetPreview/WorksheetPreview.tsx', 'utf8');

content = content.replace(
  /<ChoiceTemplate\n\s*instruction=\{worksheet.instruction\}\n\s*items=\{items\}\n\s*layout=\{worksheet.layout\}\n\s*itemScale=\{worksheet.itemScale\}\n\s*seed=\{shuffleSeed \+ variantIndex \* 100\}\n\s*simpleMode=\{worksheet.simpleMode\}\n\s*\/>/,
  `<ChoiceTemplate
          instruction={worksheet.instruction}
          items={items}
          layout={worksheet.layout}
          itemScale={worksheet.itemScale}
          seed={shuffleSeed + variantIndex * 100}
          simpleMode={worksheet.simpleMode}
          showCheckboxes={worksheet.choiceShowCheckboxes}
        />`
);

content = content.replace(
  /<MatchPairsTemplate\n\s*instruction=\{worksheet.instruction\}\n\s*pairs=\{pairs\}\n\s*shuffledRight=\{shuffledRight\}\n\s*itemScale=\{worksheet.itemScale\}\n\s*simpleMode=\{worksheet.simpleMode\}\n\s*\/>/,
  `<MatchPairsTemplate
          instruction={worksheet.instruction}
          pairs={pairs}
          shuffledRight={shuffledRight}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
          lineStyle={worksheet.matchPairsLineStyle}
        />`
);

content = content.replace(
  /<CountTemplate\n\s*instruction=\{worksheet.instruction\}\n\s*item=\{items\[0\]\}\n\s*repetitions=\{worksheet.countRepetitions\}\n\s*itemScale=\{worksheet.itemScale\}\n\s*simpleMode=\{worksheet.simpleMode\}\n\s*\/>/,
  `<CountTemplate
          instruction={worksheet.instruction}
          item={items[0]}
          repetitions={worksheet.countRepetitions}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
          scattered={worksheet.countScattered}
        />`
);

content = content.replace(
  /<YesNoTemplate\n\s*instruction=\{worksheet.instruction\}\n\s*item=\{items\[0\]\}\n\s*itemScale=\{worksheet.itemScale\}\n\s*simpleMode=\{worksheet.simpleMode\}\n\s*\/>/,
  `<YesNoTemplate
          instruction={worksheet.instruction}
          item={items[0]}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
          useColors={worksheet.yesNoUseColors}
        />`
);

content = content.replace(
  /<SequenceTemplate\n\s*instruction=\{worksheet.instruction\}\n\s*patternItems=\{worksheet.sequenceItems\}\n\s*repetitions=\{worksheet.sequenceRepetitions\}\n\s*blanks=\{worksheet.sequenceBlanks\}\n\s*itemScale=\{worksheet.itemScale\}\n\s*simpleMode=\{worksheet.simpleMode\}\n\s*\/>/,
  `<SequenceTemplate
          instruction={worksheet.instruction}
          patternItems={worksheet.sequenceItems}
          repetitions={worksheet.sequenceRepetitions}
          blanks={worksheet.sequenceBlanks}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
          blankStyle={worksheet.sequenceBlankStyle}
        />`
);

content = content.replace(
  /<CutCardsTemplate\n\s*instruction=\{worksheet.instruction\}\n\s*items=\{items\}\n\s*showBorder=\{worksheet.cutCardsShowBorder\}\n\s*itemScale=\{worksheet.itemScale\}\n\s*simpleMode=\{worksheet.simpleMode\}\n\s*\/>/,
  `<CutCardsTemplate
          instruction={worksheet.instruction}
          items={items}
          showBorder={worksheet.cutCardsShowBorder}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
          cardsPerRow={worksheet.cutCardsPerRow}
        />`
);

content = content.replace(
  /<SameOrDifferentTemplate\n\s*instruction=\{worksheet.instruction\}\n\s*items=\{items\}\n\s*itemScale=\{worksheet.itemScale\}\n\s*simpleMode=\{worksheet.simpleMode\}\n\s*\/>/,
  `<SameOrDifferentTemplate
          instruction={worksheet.instruction}
          items={items}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
          referenceStyle={worksheet.sameOrDifferentReferenceStyle}
        />`
);

content = content.replace(
  /<CategorizeTemplate\n\s*instruction=\{worksheet.instruction\}\n\s*items=\{items\}\n\s*categories=\{worksheet.categories\}\n\s*itemScale=\{worksheet.itemScale\}\n\s*seed=\{shuffleSeed \+ variantIndex \* 100\}\n\s*simpleMode=\{worksheet.simpleMode\}\n\s*\/>/,
  `<CategorizeTemplate
          instruction={worksheet.instruction}
          items={items}
          categories={worksheet.categories}
          itemScale={worksheet.itemScale}
          seed={shuffleSeed + variantIndex * 100}
          simpleMode={worksheet.simpleMode}
          layout={worksheet.categorizeLayout}
        />`
);

fs.writeFileSync('src/components/WorksheetPreview/WorksheetPreview.tsx', content);
