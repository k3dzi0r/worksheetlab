interface InstructionTextProps {
  instruction: string
  /** W trybie prostym polecenie jest większe i pogrubione dla lepszej czytelności. */
  simpleMode?: boolean
}

/** Wspólny nagłówek polecenia używany przez wszystkie szablony. */
export function InstructionText({ instruction, simpleMode = false }: InstructionTextProps) {
  return (
    <p className={simpleMode ? 'text-3xl font-bold text-center' : 'text-xl font-semibold text-center'}>
      {instruction || 'Wpisz polecenie...'}
    </p>
  )
}
