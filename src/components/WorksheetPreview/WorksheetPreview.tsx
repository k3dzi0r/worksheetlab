import { useEffect, useMemo } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { WorksheetPage, WorksheetState } from '../../types/worksheet'
import { shuffleArraySeeded } from '../../utils'
import { ChoiceTemplate } from '../../templates/ChoiceTemplate'
import { MatchPairsTemplate } from '../../templates/MatchPairsTemplate'
import { CountTemplate } from '../../templates/CountTemplate'
import { YesNoTemplate } from '../../templates/YesNoTemplate'
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
import { BUY_COFFEE } from '../../support'

interface WorksheetTaskPreviewProps {
  showAnswerKey?: boolean
  worksheet: WorksheetState
  /** Wartość zmieniana przy każdym „Losuj kolejność”, wymusza nowe tasowanie prawej kolumny. */
  shuffleSeed: number
  /** Indeks wariantu (0 to oryginał użytkownika, >0 to losowy na bazie seeda). */
  variantIndex?: number
}

interface WorksheetPreviewProps {
  showPageNumbers?: boolean
  showBranding?: boolean
  pageIndex?: number
  totalPages?: number
  showAnswerKey?: boolean
  page: WorksheetPage
  shuffleSeed: number
  variantIndex?: number
  /** Zadanie edytowane w panelu - wyróżnione na ekranie, gdy na stronie jest ich kilka. */
  activeTaskIndex?: number
  /** Kliknięcie w zadanie na kartce otwiera jego edycję. */
  onTaskClick?: (taskIndex: number) => void
}

const PRINT_STYLE_ELEMENT_ID = 'worksheetlab-print-orientation'

/**
 * `@page` nie obsługuje selektorów klas, więc orientację wydruku ustawiamy,
 * wstrzykując/aktualizując dedykowany element <style> w <head>. Orientacja
 * jest wspólna dla całego projektu (wymuszane w App), dlatego każdy podgląd
 * zapisuje identyczną regułę.
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

/** Renderuje jedno zadanie; zewnętrzny komponent układa zadania na kartce. */
function WorksheetTaskPreview({ worksheet, shuffleSeed, variantIndex = 0, showAnswerKey = false }: WorksheetTaskPreviewProps) {

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

  return (
    <>
      {worksheet.template === null && (
        <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-gray-500 print:hidden">
          <span className="text-2xl font-medium">Pusta karta</span>
          <span className="rounded-full bg-blue-600 px-8 py-4 text-2xl font-semibold text-white shadow-md">
            Wybierz szablon albo przykład
          </span>
        </div>
      )}
      {worksheet.template === 'choice' && (
        <ChoiceTemplate
          instruction={worksheet.instruction}
          items={items}
          layout={worksheet.layout}
          itemScale={worksheet.itemScale}
          seed={shuffleSeed + variantIndex * 100}
          instructionScale={worksheet.instructionScale}
          showCheckboxes={worksheet.choiceShowCheckboxes}
        />
      )}
      {worksheet.template === 'matchPairs' && (
        <MatchPairsTemplate
          instruction={worksheet.instruction}
          pairs={pairs}
          shuffledRight={shuffledRight}
          itemScale={worksheet.itemScale}
          instructionScale={worksheet.instructionScale}
          lineStyle={worksheet.matchPairsLineStyle}
        />
      )}
      {worksheet.template === 'count' && (
        <CountTemplate
          instruction={worksheet.instruction}
          item={items[0]}
          repetitions={worksheet.countRepetitions}
          itemScale={worksheet.itemScale}
          instructionScale={worksheet.instructionScale}
          scattered={worksheet.countScattered}
        />
      )}
      {worksheet.template === 'yesNo' && (
        <YesNoTemplate
          instruction={worksheet.instruction}
          item={items[0]}
          itemScale={worksheet.itemScale}
          instructionScale={worksheet.instructionScale}
          useColors={worksheet.yesNoUseColors}
        />
      )}
      {worksheet.template === 'sequence' && (
        <SequenceTemplate
          instruction={worksheet.instruction}
          patternItems={worksheet.sequenceItems}
          repetitions={worksheet.sequenceRepetitions}
          blanks={worksheet.sequenceBlanks}
          itemScale={worksheet.itemScale}
          instructionScale={worksheet.instructionScale}
          blankStyle={worksheet.sequenceBlankStyle}
        />
      )}
      {worksheet.template === 'cutCards' && (
        <CutCardsTemplate
          instruction={worksheet.instruction}
          items={items}
          itemScale={worksheet.itemScale}
          showBorder={worksheet.cutCardsShowBorder}
          instructionScale={worksheet.instructionScale}
        />
      )}
      {worksheet.template === 'sameOrDifferent' && (
        <SameOrDifferentTemplate
          instruction={worksheet.instruction}
          items={items}
          itemScale={worksheet.itemScale}
          instructionScale={worksheet.instructionScale}
          referenceStyle={worksheet.sameOrDifferentReferenceStyle}
        />
      )}
      {worksheet.template === 'categorize' && (
        <CategorizeTemplate
          instruction={worksheet.instruction}
          items={items}
          categories={worksheet.categories}
          itemScale={worksheet.itemScale}
          instructionScale={worksheet.instructionScale}
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
    </>
  )
}

/** Podgląd strony A4 z jednym lub wieloma niezależnymi zadaniami. */
export function WorksheetPreview({ page, shuffleSeed, variantIndex = 0, showAnswerKey = false, showPageNumbers, showBranding = true, pageIndex, totalPages, activeTaskIndex, onTaskClick }: WorksheetPreviewProps) {
  usePrintOrientation(page.orientation)

  const pageStyle: CSSProperties = {
    '--page-width': page.orientation === 'landscape' ? '297mm' : '210mm',
    '--page-height': page.orientation === 'landscape' ? '210mm' : '297mm',
  } as CSSProperties

  return (
    <div id="worksheet-page" className="worksheet-a4 bg-white shadow-lg mx-auto relative" style={pageStyle}>
      <WorksheetHeaderView header={page.header} instructionScale={page.tasks[0]?.instructionScale ?? 1} />
      <div className={`worksheet-task-grid task-count-${page.tasks.length}`}>
        {page.tasks.map((task, index) => (
          <section
            key={task.id ?? index}
            data-task-zone
            className={`worksheet-task-zone ${onTaskClick ? 'is-clickable' : ''} ${
              page.tasks.length > 1 && index === activeTaskIndex ? 'is-active-task' : ''
            }`}
            {...(onTaskClick && {
              role: 'button',
              tabIndex: 0,
              title: task.template ? `Edytuj zadanie ${index + 1}` : 'Wybierz szablon',
              'aria-label': task.template ? `Edytuj zadanie ${index + 1}` : `Wybierz szablon dla zadania ${index + 1}`,
              onClick: () => onTaskClick(index),
              onKeyDown: (event: KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onTaskClick(index)
                }
              },
            })}
          >
            <WorksheetTaskPreview
              worksheet={{ ...task, orientation: page.orientation, header: page.header, variantCount: page.variantCount }}
              shuffleSeed={shuffleSeed + index * 1_000}
              variantIndex={variantIndex}
              showAnswerKey={showAnswerKey}
            />
          </section>
        ))}
      </div>
      {(showBranding || (showPageNumbers && pageIndex !== undefined && totalPages !== undefined)) && (
        <div className="worksheet-page-meta">
          {showBranding && <span>Wygenerowano w KartoLab · {BUY_COFFEE.appDisplayUrl}</span>}
          {showPageNumbers && pageIndex !== undefined && totalPages !== undefined && <span>{pageIndex + 1} / {totalPages}</span>}
        </div>
      )}
    </div>
  )
}
