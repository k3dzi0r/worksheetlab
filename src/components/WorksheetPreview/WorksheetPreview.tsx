import { useMemo } from 'react'
import type { WorksheetState } from '../../types/worksheet'
import { shuffleArray } from '../../utils'
import { ChoiceTemplate } from '../../templates/ChoiceTemplate'
import { MatchPairsTemplate } from '../../templates/MatchPairsTemplate'
import { CountTemplate } from '../../templates/CountTemplate'

interface WorksheetPreviewProps {
  worksheet: WorksheetState
  /** Wartość zmieniana przy każdym „Losuj kolejność”, wymusza nowe tasowanie prawej kolumny. */
  shuffleSeed: number
}

/** Podgląd kartki A4 – to jedyny fragment strony widoczny podczas drukowania. */
export function WorksheetPreview({ worksheet, shuffleSeed }: WorksheetPreviewProps) {
  const shuffledRight = useMemo(
    () => shuffleArray(worksheet.pairs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worksheet.pairs, shuffleSeed],
  )

  return (
    <div id="worksheet-page" className="worksheet-a4 bg-white shadow-lg mx-auto">
      {worksheet.template === 'choice' && (
        <ChoiceTemplate instruction={worksheet.instruction} items={worksheet.items} />
      )}
      {worksheet.template === 'matchPairs' && (
        <MatchPairsTemplate
          instruction={worksheet.instruction}
          pairs={worksheet.pairs}
          shuffledRight={shuffledRight}
        />
      )}
      {worksheet.template === 'count' && (
        <CountTemplate
          instruction={worksheet.instruction}
          item={worksheet.items[0]}
          repetitions={worksheet.countRepetitions}
        />
      )}
    </div>
  )
}
