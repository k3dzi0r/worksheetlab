import { useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { WorksheetState } from '../../types/worksheet'
import { shuffleArray } from '../../utils'
import { ChoiceTemplate } from '../../templates/ChoiceTemplate'
import { MatchPairsTemplate } from '../../templates/MatchPairsTemplate'
import { CountTemplate } from '../../templates/CountTemplate'
import { YesNoTemplate } from '../../templates/YesNoTemplate'
import { OddOneOutTemplate } from '../../templates/OddOneOutTemplate'
import { SequenceTemplate } from '../../templates/SequenceTemplate'
import { CutCardsTemplate } from '../../templates/CutCardsTemplate'
import { WorksheetHeaderView } from './WorksheetHeaderView'

interface WorksheetPreviewProps {
  worksheet: WorksheetState
  /** Wartość zmieniana przy każdym „Losuj kolejność”, wymusza nowe tasowanie prawej kolumny. */
  shuffleSeed: number
}

const PRINT_STYLE_ELEMENT_ID = 'worksheetlab-print-orientation'

/**
 * `@page` nie obsługuje selektorów klas, więc orientację wydruku ustawiamy,
 * wstrzykując/aktualizując dedykowany element <style> w <head>.
 */
function usePrintOrientation(orientation: WorksheetState['orientation']) {
  useEffect(() => {
    let styleEl = document.getElementById(PRINT_STYLE_ELEMENT_ID) as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = PRINT_STYLE_ELEMENT_ID
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = `@media print { @page { size: A4 ${orientation}; margin: 0; } }`
  }, [orientation])
}

/** Podgląd kartki A4 – to jedyny fragment strony widoczny podczas drukowania. */
export function WorksheetPreview({ worksheet, shuffleSeed }: WorksheetPreviewProps) {
  usePrintOrientation(worksheet.orientation)

  const shuffledRight = useMemo(
    () => shuffleArray(worksheet.pairs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worksheet.pairs, shuffleSeed],
  )

  const pageStyle: CSSProperties = {
    '--page-width': worksheet.orientation === 'landscape' ? '297mm' : '210mm',
    '--page-height': worksheet.orientation === 'landscape' ? '210mm' : '297mm',
  } as CSSProperties

  return (
    <div id="worksheet-page" className="worksheet-a4 bg-white shadow-lg mx-auto" style={pageStyle}>
      <WorksheetHeaderView header={worksheet.header} simpleMode={worksheet.simpleMode} />
      {worksheet.template === 'choice' && (
        <ChoiceTemplate
          instruction={worksheet.instruction}
          items={worksheet.items}
          layout={worksheet.layout}
          itemScale={worksheet.itemScale}
          seed={shuffleSeed}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'matchPairs' && (
        <MatchPairsTemplate
          instruction={worksheet.instruction}
          pairs={worksheet.pairs}
          shuffledRight={shuffledRight}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'count' && (
        <CountTemplate
          instruction={worksheet.instruction}
          item={worksheet.items[0]}
          repetitions={worksheet.countRepetitions}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'yesNo' && (
        <YesNoTemplate
          instruction={worksheet.instruction}
          item={worksheet.items[0]}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'oddOneOut' && (
        <OddOneOutTemplate
          instruction={worksheet.instruction}
          items={worksheet.items}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'sequence' && (
        <SequenceTemplate
          instruction={worksheet.instruction}
          patternItems={worksheet.sequenceItems}
          repetitions={worksheet.sequenceRepetitions}
          blanks={worksheet.sequenceBlanks}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'cutCards' && (
        <CutCardsTemplate
          instruction={worksheet.instruction}
          items={worksheet.items}
          itemScale={worksheet.itemScale}
          showBorder={worksheet.cutCardsShowBorder}
          simpleMode={worksheet.simpleMode}
        />
      )}
    </div>
  )
}
