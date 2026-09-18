import type { WorksheetItem } from '../../types/worksheet'

interface WorksheetItemViewProps {
  item: WorksheetItem
  /** Globalny rozmiar (mnożnik) ustawiony suwakiem w edytorze - używany, gdy element nie ma własnego rozmiaru. */
  baseScale: number
  /** W trybie prostym elementy i podpisy są dodatkowo powiększone. */
  simpleMode?: boolean
}

/** Bazowy rozmiar elementu przy mnożniku = 1. */
const BASE_DIMENSION_REM = 3.75

/** Mnożnik rozmiaru w trybie prostym — jedno miejsce sterujące „powiększeniem” całej karty. */
const SIMPLE_MODE_SCALE = 1.35

/** Renderuje pojedynczy element karty pracy: obraz albo emoji, z opcjonalnym podpisem pod spodem. */
export function WorksheetItemView({ item, baseScale, simpleMode = false }: WorksheetItemViewProps) {
  // Element może mieć własny rozmiar (ustawiony indywidualnie) - w przeciwnym razie używamy globalnego.
  const effectiveScale = item.scale ?? baseScale
  const simpleModeMultiplier = simpleMode ? SIMPLE_MODE_SCALE : 1
  const dimension = `${BASE_DIMENSION_REM * effectiveScale * simpleModeMultiplier}rem`
  const captionMaxWidth = `${(BASE_DIMENSION_REM * effectiveScale + 3) * simpleModeMultiplier}rem`
  const captionFontSize = `${0.85 * simpleModeMultiplier}rem`

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
