import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface CutCardsTemplateProps {
  instruction: string
  instructionScale?: number
  items: WorksheetItem[]
  itemScale: number
  showBorder: boolean
  cardsPerRow?: number
}

const BASE_DIMENSION_REM = 3.75
/** Zapas miejsca wokół elementu w kartoniku, żeby ramka nie przylegała bezpośrednio do obrazka/emoji. */
const CARD_PADDING_REM = 1

/**
 * Szablon kart do wycinania: wszystkie kartoniki mają identyczny rozmiar (niezależnie od
 * ewentualnego indywidualnego rozmiaru elementu), ułożone w siatce gotowej do wydruku i wycięcia.
 */
export function CutCardsTemplate({ instruction, instructionScale = 1, items, itemScale, showBorder, cardsPerRow = 3 }: CutCardsTemplateProps) {
  
  const cardDimension = `${BASE_DIMENSION_REM * itemScale + CARD_PADDING_REM * 2}rem`
  const columns = cardsPerRow; // removed gridColumns fallback as it's explicit now

  return (
    <div className="flex flex-col gap-8 pt-8 h-full">
      <InstructionText instruction={instruction} instructionScale={instructionScale} />
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
            <WorksheetItemView item={{ ...item, scale: undefined }} baseScale={itemScale}  />
          </div>
        ))}
      </div>
    </div>
  )
}
