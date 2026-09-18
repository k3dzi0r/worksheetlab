import type { WorksheetItem, ItemSize } from '../../types/worksheet'

interface WorksheetItemViewProps {
  item: WorksheetItem
  /** Rozmiar czcionki/obrazu — kontrolowany przez użytkownika w edytorze. */
  size?: ItemSize
}

const DIMENSION_BY_SIZE: Record<ItemSize, string> = {
  sm: '2.75rem',
  md: '3.75rem',
  lg: '5rem',
}

/** Renderuje pojedynczy element karty pracy: obraz albo emoji. Bez ramek i przycisków. */
export function WorksheetItemView({ item, size = 'lg' }: WorksheetItemViewProps) {
  const dimension = DIMENSION_BY_SIZE[size]

  if (item.source === 'image' && item.imageDataUrl) {
    return (
      <img
        src={item.imageDataUrl}
        alt={item.label}
        style={{ width: dimension, height: dimension, objectFit: 'contain' }}
      />
    )
  }

  return (
    <span style={{ fontSize: dimension, lineHeight: 1 }} role="img" aria-label={item.label}>
      {item.emoji}
    </span>
  )
}
