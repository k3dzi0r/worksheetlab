import type { WorksheetItem } from '../../types/worksheet'

interface WorksheetItemViewProps {
  item: WorksheetItem
  /** Rozmiar czcionki/obrazu — szablony różnią się wielkością elementów. */
  size?: 'md' | 'lg'
}

/** Renderuje pojedynczy element karty pracy: obraz albo emoji. Bez ramek i przycisków. */
export function WorksheetItemView({ item, size = 'lg' }: WorksheetItemViewProps) {
  const dimension = size === 'lg' ? '5rem' : '3.5rem'

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
