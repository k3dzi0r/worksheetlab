const fs = require('fs');

const content = `interface InstructionTextProps {
  instruction: string
  instructionScale?: number
}

/** Wspólny nagłówek polecenia używany przez wszystkie szablony. */
export function InstructionText({ instruction, instructionScale = 1 }: InstructionTextProps) {
  return (
    <p 
      className="font-semibold text-center leading-snug"
      style={{ fontSize: \`\${1.25 * instructionScale}rem\` }}
    >
      {instruction || 'Wpisz polecenie...'}
    </p>
  )
}
`;
fs.writeFileSync('src/components/WorksheetPreview/InstructionText.tsx', content);
