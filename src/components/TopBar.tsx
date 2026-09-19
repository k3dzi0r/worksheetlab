
interface TopBarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onPrint: () => void
  /** Losowanie kolejności ma sens tylko w części szablonów. */
  showShuffle: boolean
  onShuffle: () => void
  saveStatus: 'saved' | 'saving' | 'idle'
  /** Skala podglądu w procentach; null oznacza dopasowanie do szerokości panelu. */
  zoom: number | null
  /** Skala faktycznie użyta - pokazujemy ją, gdy podgląd jest dopasowywany automatycznie. */
  effectiveZoom: number
  onZoomChange: (zoom: number | null) => void
}

/**
 * Pasek nad podglądem: to, co nauczyciel klika najczęściej i na końcu pracy.
 * Wcześniej te przyciski siedziały na samym dole panelu bocznego, pod wszystkimi
 * ustawieniami - przy dłuższych szablonach trzeba było do nich przewijać.
 */
export function TopBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPrint,
  showShuffle,
  onShuffle,
  saveStatus,
  zoom,
  effectiveZoom,
  onZoomChange,
}: TopBarProps) {
  return (
    // Pasek zawija się przy wąskim oknie - lepszy drugi rząd niż przyciski uciekające poza ekran.
    <div className="print:hidden w-full bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 flex-wrap">
      <div className="flex items-center gap-1">
        <IconButton label="Cofnij" disabled={!canUndo} onClick={onUndo}>
          <path d="M9 14 L4 9 L9 4" />
          <path d="M4 9 h7 a5 5 0 0 1 0 10 H8" />
        </IconButton>
        <IconButton label="Ponów" disabled={!canRedo} onClick={onRedo}>
          <path d="M15 14 L20 9 L15 4" />
          <path d="M20 9 h-7 a5 5 0 0 0 0 10 H16" />
        </IconButton>
      </div>

      <span className="w-px h-6 bg-gray-200" />

      {showShuffle && (
        <button
          type="button"
          onClick={onShuffle}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 whitespace-nowrap mr-1.5"
        >
          Losuj kolejność
        </button>
      )}

      {/* Zoom podglądu: przy trzech kolumnach kartka A4 nie zawsze mieści się w naturalnej skali. */}
      <div className="flex items-center gap-0.5">
        <IconButton
          label="Pomniejsz"
          onClick={() => onZoomChange(Math.max(30, Math.round(effectiveZoom * 100) - 10))}
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </IconButton>
        <button
          type="button"
          onClick={() => onZoomChange(null)}
          title="Dopasuj do szerokości"
          className={`px-1.5 py-1 rounded text-xs tabular-nums w-14 ${
            zoom === null ? 'text-blue-700 font-medium bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {Math.round(effectiveZoom * 100)}%
        </button>
        <IconButton
          label="Powiększ"
          onClick={() => onZoomChange(Math.min(200, Math.round(effectiveZoom * 100) + 10))}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </IconButton>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {saveStatus === 'saved' && <span className="text-green-600 font-medium">✔ zapisano</span>}
          {saveStatus === 'saving' && 'zapisywanie...'}
        </span>

        <button
          type="button"
          onClick={onPrint}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 whitespace-nowrap ml-2"
        >
          Drukuj / Zapisz PDF
        </button>
      </div>
    </div>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  )
}
