import type { WorksheetHeader } from '../../types/worksheet'

interface WorksheetHeaderViewProps {
  header: WorksheetHeader
  simpleMode: boolean
}

/**
 * Nagłówek drukowany na górze kartki: opcjonalny tytuł i pola do wypełnienia
 * przez ucznia (imię i nazwisko, data, klasa). Puste/wyłączone pola nie
 * zajmują miejsca na stronie.
 */
export function WorksheetHeaderView({ header, simpleMode }: WorksheetHeaderViewProps) {
  const hasFields = header.showName || header.showDate || header.showClass
  if (!header.showTitle && !hasFields) return null

  return (
    <div className="worksheet-header mb-4">
      {header.showTitle && header.title.trim() && (
        <h2 className={`font-bold text-gray-900 ${simpleMode ? 'text-3xl' : 'text-2xl'}`}>{header.title}</h2>
      )}
      {hasFields && (
        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-2 text-base text-gray-800">
          {header.showName && <HeaderField label={header.nameLabel || 'Imię i nazwisko'} width="16rem" />}
          {header.showDate && <HeaderField label={header.dateLabel || 'Data'} width="9rem" />}
          {header.showClass && <HeaderField label={header.classLabel || 'Klasa'} width="7rem" />}
        </div>
      )}
    </div>
  )
}

function HeaderField({ label, width }: { label: string; width: string }) {
  return (
    <div className="flex items-end gap-2 whitespace-nowrap">
      <span>{label}:</span>
      <span className="border-b border-gray-500 flex-1" style={{ width }}>
        &nbsp;
      </span>
    </div>
  )
}
