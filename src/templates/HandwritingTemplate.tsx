import type { WorksheetState } from '../types/worksheet'

interface HandwritingTemplateProps {
  worksheet: WorksheetState
}

export function HandwritingTemplate({ worksheet }: HandwritingTemplateProps) {
  const { handwritingText = '', handwritingMode = 'tracing', itemScale = 1 } = worksheet

  // Split by newlines, if empty add at least one line to show the grid
  const lines = handwritingText ? handwritingText.split('\n') : ['']
  
  const getTextClass = () => {
    switch(handwritingMode) {
      case 'solid': return 'text-gray-900'
      case 'tracing': return 'text-transparent'
      case 'empty': return 'text-transparent'
      default: return 'text-transparent'
    }
  }

  const isTracing = handwritingMode === 'tracing'
  const isEmpty = handwritingMode === 'empty'

  const baseHeight = 80 * itemScale
  const fontSize = 56 * itemScale
  const gapSize = 40 * itemScale

  return (
    <div className="flex flex-col w-full p-8" style={{ gap: gapSize, fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
      {lines.map((line, index) => (
        <div key={index} className="relative w-full" style={{ height: baseHeight }}>
          {/* Liniatura tła */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between" style={{ paddingBottom: '4px' }}>
            <div className="w-full border-t-[2px] border-blue-400"></div>
            <div className="w-full border-t border-dashed border-gray-400"></div>
            <div className="w-full border-t-[2px] border-red-400"></div>
          </div>
          
          {/* Tekst */}
          {!isEmpty && (
            <div 
              className={`absolute inset-0 flex items-center justify-start px-4 ${getTextClass()}`}
              style={{
                fontSize: fontSize,
                lineHeight: `${baseHeight}px`,
                WebkitTextStroke: isTracing ? '2px #94a3b8' : 'none',
                letterSpacing: 4 * itemScale
              }}
            >
              {line || ' '}
            </div>
          )}
          {isEmpty && (
             <div 
             className="absolute inset-0"
             style={{
               fontSize: fontSize,
               lineHeight: `${baseHeight}px`,
             }}
           >
             &nbsp;
           </div>
          )}
        </div>
      ))}
    </div>
  )
}
