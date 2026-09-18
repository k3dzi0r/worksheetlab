import type { ItemSize, WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface OddOneOutTemplateProps {
  instruction: string
  items: WorksheetItem[]
  itemSize: ItemSize
  simpleMode?: boolean
}

/** Szablon „Co nie pasuje?”: 3-6 elementów w rzędzie, uczeń wskazuje ten niepasujący. */
export function OddOneOutTemplate({ instruction, items, itemSize, simpleMode = false }: OddOneOutTemplateProps) {
  return (
    <div className="flex flex-col items-center gap-12 pt-8 h-full">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />
      <div className={`flex flex-1 flex-wrap justify-center items-center ${simpleMode ? 'gap-16' : 'gap-10'}`}>
        {items.map((item) => (
          <WorksheetItemView key={item.id} item={item} size={itemSize} simpleMode={simpleMode} />
        ))}
      </div>
    </div>
  )
}
