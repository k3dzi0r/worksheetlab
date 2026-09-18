import type { MatchPair } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface MatchPairsTemplateProps {
  instruction: string
  pairs: MatchPair[]
  /** Prawa kolumna w kolejności do wyświetlenia (może być przetasowana). */
  shuffledRight: MatchPair[]
  simpleMode?: boolean
}

/** Szablon „Połącz w pary”: dwie kolumny z dużą przestrzenią na rysowanie linii. */
export function MatchPairsTemplate({ instruction, pairs, shuffledRight, simpleMode = false }: MatchPairsTemplateProps) {
  // Renderujemy tylko pary, które mają już oba elementy.
  const completeLeft = pairs.filter((pair) => pair.right)
  const completeRight = shuffledRight.filter((pair) => pair.right)
  const itemSize = simpleMode ? 'lg' : 'md'

  return (
    <div className="flex flex-col gap-10 pt-8">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />
      <div className="flex justify-between items-stretch px-4">
        <div className={`flex flex-col ${simpleMode ? 'gap-14' : 'gap-10'}`}>
          {completeLeft.map((pair) => (
            <WorksheetItemView key={pair.id} item={pair.left} size={itemSize} simpleMode={simpleMode} />
          ))}
        </div>
        {/* Pusta przestrzeń środkowa – tutaj uczeń narysuje linie łączące pary. */}
        <div className="flex-1" />
        <div className={`flex flex-col ${simpleMode ? 'gap-14' : 'gap-10'}`}>
          {completeRight.map((pair) => (
            <WorksheetItemView key={pair.id} item={pair.right!} size={itemSize} simpleMode={simpleMode} />
          ))}
        </div>
      </div>
    </div>
  )
}
