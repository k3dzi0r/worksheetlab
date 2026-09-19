import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface CategorizeTemplateProps {
  instruction: string
  instructionScale?: number
  items: WorksheetItem[]
  categories: string[]
  itemScale: number
  layout?: 'columns' | 'areas'
}

export function CategorizeTemplate({ instruction, instructionScale = 1, items, categories, itemScale, layout = 'columns' }: CategorizeTemplateProps) {
  return (
    <div className="flex flex-col gap-8 pt-8 h-full">
      <InstructionText instruction={instruction} instructionScale={instructionScale} />

      
      {layout === 'columns' ? (
        <div className="flex w-full px-8 gap-0 flex-1 min-h-[30%]">
          {categories.map((category, index) => (
            <div key={index} className={`flex-1 flex flex-col items-center border-gray-800 ${index === 0 ? 'border-l-2' : ''} border-r-2 border-t-2 border-b-2`}>
              <h2 className={`font-bold py-4 text-center w-full border-b-2 border-gray-800 bg-gray-50 text-xl`}>
                {category}
              </h2>
              <div className="w-full flex-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex w-full px-8 gap-8 flex-1 min-h-[30%]">
          {categories.map((category, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <h2 className={`font-bold mb-4 text-center text-xl`}>
                {category}
              </h2>
              <div className="w-full flex-1 border-2 border-dashed border-gray-400 rounded-[50px]" />
            </div>
          ))}
        </div>
      )}


      <div className="px-8 pb-8">
        <div className={`flex flex-wrap justify-center items-center gap-8`}>
          {items.map((item) => (
            <WorksheetItemView key={item.id} item={item} baseScale={itemScale}  />
          ))}
        </div>
      </div>
    </div>
  )
}

