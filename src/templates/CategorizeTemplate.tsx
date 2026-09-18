import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface CategorizeTemplateProps {
  instruction: string
  items: WorksheetItem[]
  categories: string[]
  itemScale: number
  simpleMode?: boolean
}

export function CategorizeTemplate({ instruction, items, categories, itemScale, simpleMode = false }: CategorizeTemplateProps) {
  return (
    <div className="flex flex-col gap-8 pt-8 h-full">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />

      <div className="flex w-full px-8 gap-4 flex-1 min-h-[30%]">
        {categories.map((category, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <h2 className={`font-bold mb-4 text-center ${simpleMode ? 'text-3xl' : 'text-xl'}`}>
              {category}
            </h2>
            <div className="w-full flex-1 border-2 border-dashed border-gray-400 rounded-xl" />
          </div>
        ))}
      </div>

      <div className="px-8 pb-8">
        <div className={`flex flex-wrap justify-center items-center ${simpleMode ? 'gap-12' : 'gap-8'}`}>
          {items.map((item) => (
            <WorksheetItemView key={item.id} item={item} baseScale={itemScale} simpleMode={simpleMode} />
          ))}
        </div>
      </div>
    </div>
  )
}
