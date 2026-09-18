import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface CutCardsTemplateProps {
  instruction: string
  items: WorksheetItem[]
  itemScale: number
  showBorder: boolean
  simpleMode?: boolean
}

const BASE_DIMENSION_REM = 3.75
const SIMPLE_MODE_SCALE = 1.35
/** Zapas miejsca wokół elementu w kartoniku, żeby ramka nie przylegała bezpośrednio do obrazka/emoji. */
const CARD_PADDING_REM = 1

/** Liczba kolumn siatki dobrana automatycznie do liczby kartoników (np. 2x2, 3x3, 3x4). */
function gridColumns(total: number): number {
  return Math.max(1, Math.ceil(Math.sqrt(total)))
}

/**
 * Szablon kart do wycinania: wszystkie kartoniki mają identyczny rozmiar (niezależnie od
 * ewentualnego indywidualnego rozmiaru elementu), ułożone w siatce gotowej do wydruku i wycięcia.
 */
export function CutCardsTemplate({ instruction, items, itemScale, showBorder, simpleMode = false }: CutCardsTemplateProps) {
  const simpleModeMultiplier = simpleMode ? SIMPLE_MODE_SCALE : 1
  const cardDimension = `${BASE_DIMENSION_REM * itemScale * simpleModeMultiplier + CARD_PADDING_REM * 2}rem`
  const columns = gridColumns(items.length)

  return (
    <div className="flex flex-col gap-8 pt-8 h-full">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />
      <div
        className="grid flex-1 justify-center content-center mx-auto"
        style={{ gridTemplateColumns: `repeat(${columns}, ${cardDimension})`, gap: '1rem' }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-center ${showBorder ? 'border-2 border-dashed border-gray-500' : ''}`}
            style={{ width: cardDimension, height: cardDimension }}
          >
            {/* Wymuszamy jednolity rozmiar kartoników - pomijamy ewentualny indywidualny rozmiar elementu. */}
            <WorksheetItemView item={{ ...item, scale: undefined }} baseScale={itemScale} simpleMode={simpleMode} />
          </div>
        ))}
      </div>
    </div>
  )
}
