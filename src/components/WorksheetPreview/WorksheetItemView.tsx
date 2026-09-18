import type { WorksheetItem, ItemSize } from '../../types/worksheet'

interface WorksheetItemViewProps {
  item: WorksheetItem
  /** Rozmiar czcionki/obrazu — kontrolowany przez użytkownika w edytorze. */
  size?: ItemSize
  /** W trybie prostym elementy i podpisy są dodatkowo powiększone. */
  simpleMode?: boolean
}

const BASE_DIMENSION_REM: Record<ItemSize, number> = {
  sm: 2.75,
  md: 3.75,
  lg: 5,
}

/** Mnożnik rozmiaru w trybie prostym — jedno miejsce sterujące „powiększeniem” całej karty. */
const SIMPLE_MODE_SCALE = 1.35

/** Renderuje pojedynczy element karty pracy: obraz albo emoji, z opcjonalnym podpisem pod spodem. */
export function WorksheetItemView({ item, size = 'lg', simpleMode = false }: WorksheetItemViewProps) {
  const scale = simpleMode ? SIMPLE_MODE_SCALE : 1
  const dimension = `${BASE_DIMENSION_REM[size] * scale}rem`
  const captionMaxWidth = `${(BASE_DIMENSION_REM[size] + 3) * scale}rem`
  const captionFontSize = `${0.85 * scale}rem`

  const caption = item.caption?.trim()
  const showCaption = Boolean(caption) && item.showCaption !== false

  return (
    <div className="flex flex-col items-center gap-1">
      {item.source === 'image' && item.imageDataUrl ? (
        <img
          src={item.imageDataUrl}
          alt={item.label}
          style={{ width: dimension, height: dimension, objectFit: 'contain' }}
        />
      ) : (
        <span style={{ fontSize: dimension, lineHeight: 1 }} role="img" aria-label={item.label}>
          {item.emoji}
        </span>
      )}
      {showCaption && (
        <span
          className="text-center font-medium text-gray-800 break-words"
          style={{ maxWidth: captionMaxWidth, fontSize: captionFontSize, lineHeight: 1.2 }}
        >
          {caption}
        </span>
      )}
    </div>
  )
}
