import type { WorksheetState } from '../types/worksheet'

interface HandwritingTemplateProps {
  worksheet: WorksheetState
}

function parseHandwritingText(text: string, defaultMode: 'solid' | 'tracing' | 'empty') {
  const regex = /(\[z\].*?\[\/z\]|\[s\].*?\[\/s\]|\[p\].*?\[\/p\])/g
  const parts = text.split(regex)
  return parts.map((part) => {
    if (part.startsWith('[z]') && part.endsWith('[/z]')) {
      return { text: part.slice(3, -4), mode: 'solid' as const }
    }
    if (part.startsWith('[s]') && part.endsWith('[/s]')) {
      return { text: part.slice(3, -4), mode: 'tracing' as const }
    }
    if (part.startsWith('[p]') && part.endsWith('[/p]')) {
      return { text: part.slice(3, -4), mode: 'empty' as const }
    }
    return { text: part, mode: defaultMode }
  }).filter(p => p.text.length > 0)
}

export function HandwritingTemplate({ worksheet }: HandwritingTemplateProps) {
  const { 
    handwritingText = '', 
    handwritingMode = 'tracing', 
    handwritingRepeat = false, 
    handwritingFont = '"Comic Sans MS", "Chalkboard SE", sans-serif',
    itemScale = 1 
  } = worksheet

  let textLines = handwritingText ? handwritingText.split('\n') : []
  
  // Create 9 lines for the full page
  const totalLines = 9
  const lines = Array.from({ length: totalLines }).map((_, i) => {
    if (handwritingRepeat && textLines.length > 0) {
      return textLines[0]
    }
    return textLines[i] || ''
  })

  const baseHeight = 80 * itemScale
  const fontSize = 56 * itemScale
  const gapSize = 40 * itemScale

  const getStyleForMode = (mode: 'solid' | 'tracing' | 'empty') => {
    if (mode === 'solid') return { color: '#111827' }
    if (mode === 'tracing') return { color: '#d1d5db' } // szary lekko
    return { color: 'transparent' } // empty
  }

  return (
    <div className="flex flex-col w-full p-8" style={{ gap: gapSize, fontFamily: handwritingFont }}>
      {lines.map((line, index) => {
        const parts = parseHandwritingText(line, handwritingMode)
        return (
          <div key={index} className="relative w-full" style={{ height: baseHeight }}>
            {/* Liniatura tła */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between" style={{ paddingBottom: '4px' }}>
              <div className="w-full border-t-[2px] border-blue-400"></div>
              <div className="w-full border-t border-dashed border-gray-400"></div>
              <div className="w-full border-t-[2px] border-red-400"></div>
            </div>
            
            {/* Tekst - renderujemy fragmenty, zachowując białe znaki */}
            <div 
              className="absolute inset-0 flex items-center justify-start px-4"
              style={{
                fontSize: fontSize,
                lineHeight: `${baseHeight}px`,
                letterSpacing: 4 * itemScale,
                whiteSpace: 'pre'
              }}
            >
              {parts.map((part, pIndex) => (
                <span key={pIndex} style={getStyleForMode(part.mode)}>
                  {part.text}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
