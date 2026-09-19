import { useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { WorksheetState } from '../../types/worksheet'
import { shuffleArraySeeded } from '../../utils'
import { ChoiceTemplate } from '../../templates/ChoiceTemplate'
import { MatchPairsTemplate } from '../../templates/MatchPairsTemplate'
import { CountTemplate } from '../../templates/CountTemplate'
import { YesNoTemplate } from '../../templates/YesNoTemplate'
import { OddOneOutTemplate } from '../../templates/OddOneOutTemplate'
import { SequenceTemplate } from '../../templates/SequenceTemplate'
import { CutCardsTemplate } from '../../templates/CutCardsTemplate'
import { SameOrDifferentTemplate } from '../../templates/SameOrDifferentTemplate'
import { CategorizeTemplate } from '../../templates/CategorizeTemplate'
import { HandwritingTemplate } from '../../templates/HandwritingTemplate'
import { WordSearchTemplate } from '../../templates/WordSearchTemplate'
import { MazeTemplate } from '../../templates/MazeTemplate'
import { ColoringTemplate } from '../../templates/ColoringTemplate'
import { MathTemplate } from '../../templates/MathTemplate'
import { PatternTemplate } from '../../templates/PatternTemplate'
import { CrosswordTemplate } from '../../templates/CrosswordTemplate'
import { DotToDotTemplate } from '../../templates/DotToDotTemplate'
import { ClockTemplate } from '../../templates/ClockTemplate'
import { WorksheetHeaderView } from './WorksheetHeaderView'

interface WorksheetPreviewProps {
  showPageNumbers?: boolean
  pageIndex?: number
  totalPages?: number
  showAnswerKey?: boolean
  worksheet: WorksheetState
  /** Wartość zmieniana przy każdym „Losuj kolejność”, wymusza nowe tasowanie prawej kolumny. */
  shuffleSeed: number
  /** Indeks wariantu (0 to oryginał użytkownika, >0 to losowy na bazie seeda). */
  variantIndex?: number
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
export function WorksheetPreview({ worksheet, shuffleSeed, variantIndex = 0, showAnswerKey = false, showPageNumbers, pageIndex, totalPages }: WorksheetPreviewProps) {
  usePrintOrientation(worksheet.orientation)

  const items = useMemo(() => {
    if (variantIndex === 0) return worksheet.items
    
    if (worksheet.template === 'sameOrDifferent' && worksheet.items.length > 0) {
      const [reference, ...answers] = worksheet.items
      return [reference, ...shuffleArraySeeded(answers, shuffleSeed + variantIndex * 100)]
    }
    
    if (
      worksheet.template === 'sequence' ||
      worksheet.template === 'cutCards' ||
      worksheet.template === 'count' ||
      worksheet.template === 'yesNo' ||
      worksheet.template === 'maze'
    ) {
      return worksheet.items
    }
    
    return shuffleArraySeeded(worksheet.items, shuffleSeed + variantIndex * 100)
  }, [worksheet.items, worksheet.template, shuffleSeed, variantIndex])

  const pairs = useMemo(() => {
    if (variantIndex === 0) return worksheet.pairs
    if (worksheet.template !== 'matchPairs') return worksheet.pairs
    return shuffleArraySeeded(worksheet.pairs, shuffleSeed + variantIndex * 100)
  }, [worksheet.pairs, worksheet.template, shuffleSeed, variantIndex])

  const shuffledRight = useMemo(
    () => shuffleArraySeeded(pairs, shuffleSeed + variantIndex * 200 + 1),
    [pairs, shuffleSeed, variantIndex],
  )

  const pageStyle: CSSProperties = {
    '--page-width': worksheet.orientation === 'landscape' ? '297mm' : '210mm',
    '--page-height': worksheet.orientation === 'landscape' ? '210mm' : '297mm',
  } as CSSProperties

  return (
    <div id="worksheet-page" className="worksheet-a4 bg-white shadow-lg mx-auto relative" style={pageStyle}>
      <WorksheetHeaderView header={worksheet.header} simpleMode={worksheet.simpleMode} />
      {worksheet.template === 'choice' && (
        <ChoiceTemplate
          instruction={worksheet.instruction}
          items={items}
          layout={worksheet.layout}
          itemScale={worksheet.itemScale}
          seed={shuffleSeed + variantIndex * 100}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'matchPairs' && (
        <MatchPairsTemplate
          instruction={worksheet.instruction}
          pairs={pairs}
          shuffledRight={shuffledRight}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'count' && (
        <CountTemplate
          instruction={worksheet.instruction}
          item={items[0]}
          repetitions={worksheet.countRepetitions}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'yesNo' && (
        <YesNoTemplate
          instruction={worksheet.instruction}
          item={items[0]}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'oddOneOut' && (
        <OddOneOutTemplate
          instruction={worksheet.instruction}
          items={items}
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
          items={items}
          itemScale={worksheet.itemScale}
          showBorder={worksheet.cutCardsShowBorder}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'sameOrDifferent' && (
        <SameOrDifferentTemplate
          instruction={worksheet.instruction}
          items={items}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'categorize' && (
        <CategorizeTemplate
          instruction={worksheet.instruction}
          items={items}
          categories={worksheet.categories}
          itemScale={worksheet.itemScale}
          simpleMode={worksheet.simpleMode}
        />
      )}
      {worksheet.template === 'handwriting' && (
        <HandwritingTemplate worksheet={worksheet} />
      )}
      {worksheet.template === 'clock' && (
        <ClockTemplate
          worksheet={worksheet}
          seed={shuffleSeed + variantIndex * 100}
          showAnswerKey={showAnswerKey}
        />
      )}
      {worksheet.template === 'dotToDot' && (
        <DotToDotTemplate
          worksheet={worksheet}
          seed={shuffleSeed + variantIndex * 100}
          showAnswerKey={showAnswerKey}
        />
      )}
      {worksheet.template === 'crossword' && (
        <CrosswordTemplate
          worksheet={worksheet}
          seed={shuffleSeed + variantIndex * 100}
          showAnswerKey={showAnswerKey}
        />
      )}
      {worksheet.template === 'pattern' && (
        <PatternTemplate worksheet={worksheet} seed={shuffleSeed + variantIndex * 100} />
      )}
      {worksheet.template === 'math' && (
        <MathTemplate
          worksheet={worksheet}
          seed={shuffleSeed + variantIndex * 100}
          showAnswerKey={showAnswerKey}
        />
      )}
      {worksheet.template === 'coloring' && (
        <ColoringTemplate
          worksheet={worksheet}
          seed={shuffleSeed + variantIndex * 100}
          showAnswerKey={showAnswerKey}
        />
      )}
      {worksheet.template === 'maze' && (
        <MazeTemplate
          worksheet={worksheet}
          items={items}
          seed={shuffleSeed + variantIndex * 100}
          showAnswerKey={showAnswerKey}
        />
      )}
      {worksheet.template === 'wordSearch' && (
        <WordSearchTemplate
          worksheet={worksheet}
          seed={shuffleSeed + variantIndex * 100}
          showAnswerKey={showAnswerKey}
        />
      )}
      {showPageNumbers && pageIndex !== undefined && totalPages !== undefined && (
        <div className="absolute bottom-[15mm] left-0 right-0 text-center text-xs text-gray-400 font-medium z-10 print:block">
          {pageIndex + 1} / {totalPages}
        </div>
      )}
    </div>
  )
}
