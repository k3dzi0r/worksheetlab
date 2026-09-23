const fs = require('fs');
let types = fs.readFileSync('src/types/worksheet.ts', 'utf8');

const newProps = `  /** Tak/Nie: czy używać kolorów dla kciuków (zielony/czerwony) */
  yesNoUseColors?: boolean
  /** Wybierz: czy pokazywać puste kratki na odpowiedzi obok obrazków */
  choiceShowCheckboxes?: boolean
  /** Połącz w pary: styl linii */
  matchPairsLineStyle?: 'solid' | 'dashed' | 'dotted'
  /** Policz: czy elementy mają być rozrzucone (scattered) */
  countScattered?: boolean
  /** Sekwencja: styl pustych pól (underscore lub box) */
  sequenceBlankStyle?: 'underscore' | 'box'
  /** Kartoniki do wycinania: liczba kartoników w rzędzie (domyślnie 3) */
  cutCardsPerRow?: number
  /** Taki sam/inny: styl wyróżnienia wzorca */
  sameOrDifferentReferenceStyle?: 'box' | 'underline' | 'none'
  /** Podziel na kategorie: tryb graficzny */
  categorizeLayout?: 'columns' | 'areas'`;

types = types.replace(
  /  variantCount\?: number/,
  newProps + '\n  variantCount?: number'
);

fs.writeFileSync('src/types/worksheet.ts', types);
