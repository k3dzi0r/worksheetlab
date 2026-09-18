import type { ItemSize, WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface SequenceTemplateProps {
  instruction: string
  patternItems: WorksheetItem[]
  repetitions: number
  blanks: number
  itemSize: ItemSize
  simpleMode?: boolean
}

const BLANK_DIMENSION_REM: Record<ItemSize, number> = { sm: 2.75, md: 3.75, lg: 5 }

/** Szablon „Sekwencja”: wzór z elementów powtórzony kilka razy + puste pola na końcu do uzupełnienia. */
export function SequenceTemplate({
  instruction,
  patternItems,
  repetitions,
  blanks,
  itemSize,
  simpleMode = false,
}: SequenceTemplateProps) {
  const scale = simpleMode ? 1.35 : 1
  const blankDimension = `${BLANK_DIMENSION_REM[itemSize] * scale}rem`

  // Wzór (np. 🍎 🍌) powtórzony `repetitions` razy, jeden po drugim.
  const sequence: WorksheetItem[] = []
  for (let rep = 0; rep < repetitions; rep += 1) {
    sequence.push(...patternItems)
  }

  return (
    <div className="flex flex-col items-center gap-12 pt-8 h-full">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />
      <div className={`flex-1 flex flex-wrap justify-center items-center content-center ${simpleMode ? 'gap-8' : 'gap-5'}`}>
        {patternItems.length === 0 && <p className="text-gray-400">Dodaj 2-4 elementy tworzące wzór.</p>}
        {sequence.map((item, index) => (
          <WorksheetItemView key={`${item.id}-${index}`} item={item} size={itemSize} simpleMode={simpleMode} />
        ))}
        {patternItems.length > 0 &&
          Array.from({ length: blanks }).map((_, index) => (
            <div
              key={`blank-${index}`}
              className="border-4 border-dashed border-gray-400 rounded-xl"
              style={{ width: blankDimension, height: blankDimension }}
            />
          ))}
      </div>
    </div>
  )
}
