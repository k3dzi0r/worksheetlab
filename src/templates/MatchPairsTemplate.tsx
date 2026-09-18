import type { MatchPair } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'

interface MatchPairsTemplateProps {
  instruction: string
  pairs: MatchPair[]
  /** Prawa kolumna w kolejności do wyświetlenia (może być przetasowana). */
  shuffledRight: MatchPair[]
}

/** Szablon „Połącz w pary”: dwie kolumny z dużą przestrzenią na rysowanie linii. */
export function MatchPairsTemplate({ instruction, pairs, shuffledRight }: MatchPairsTemplateProps) {
  // Renderujemy tylko pary, które mają już oba elementy.
  const completeLeft = pairs.filter((pair) => pair.right)
  const completeRight = shuffledRight.filter((pair) => pair.right)

  return (
    <div className="flex flex-col gap-10 pt-8">
      <p className="text-xl font-semibold text-center">{instruction || 'Wpisz polecenie...'}</p>
      <div className="flex justify-between items-stretch px-4">
        <div className="flex flex-col gap-10">
          {completeLeft.map((pair) => (
            <WorksheetItemView key={pair.id} item={pair.left} size="md" />
          ))}
        </div>
        {/* Pusta przestrzeń środkowa – tutaj uczeń narysuje linie łączące pary. */}
        <div className="flex-1" />
        <div className="flex flex-col gap-10">
          {completeRight.map((pair) => (
            <WorksheetItemView key={pair.id} item={pair.right!} size="md" />
          ))}
        </div>
      </div>
    </div>
  )
}
