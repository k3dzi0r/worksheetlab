
interface TopBarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onPrint: () => void
  saveStatus: 'saved' | 'saving' | 'idle'
  /** Skala podglądu w procentach; null oznacza dopasowanie całej strony. */
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
  saveStatus,
  zoom,
  effectiveZoom,
  onZoomChange,
}: TopBarProps) {
  return (
    // Pasek zawija się przy wąskim oknie - lepszy drugi rząd niż przyciski uciekające poza ekran.
    <div className="top-bar print:hidden w-full bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-1.5">
      <div className="top-bar-history flex items-center gap-1">
        <IconButton label="Cofnij" disabled={!canUndo} onClick={onUndo}>
          <path d="M9 14 L4 9 L9 4" />
          <path d="M4 9 h7 a5 5 0 0 1 0 10 H8" />
        </IconButton>
        <IconButton label="Ponów" disabled={!canRedo} onClick={onRedo}>
          <path d="M15 14 L20 9 L15 4" />
          <path d="M20 9 h-7 a5 5 0 0 0 0 10 H16" />
        </IconButton>
      </div>

      <span className="top-bar-divider w-px h-6 bg-gray-200" />

      {/* Zoom podglądu: przy trzech kolumnach kartka A4 nie zawsze mieści się w naturalnej skali. */}
      <div className="top-bar-zoom flex items-center gap-0.5">
        <IconButton
          label="Pomniejsz"
          onClick={() => onZoomChange(Math.max(5, Math.round(effectiveZoom * 100) - 10))}
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </IconButton>
        <span className="top-bar-zoom-value text-xs tabular-nums text-gray-600 w-10 text-center" aria-live="polite">
          {Math.round(effectiveZoom * 100)}%
        </span>
        <IconButton
          label="Powiększ"
          onClick={() => onZoomChange(Math.min(200, Math.round(effectiveZoom * 100) + 10))}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </IconButton>
        {/* Osobny, podpisany przycisk zamiast klikalnych procentów - wcześniej nikt nie wiedział, że tam jest. */}
        <button
          type="button"
          onClick={() => onZoomChange(null)}
          title="Pokaż całą stronę"
          aria-label="Pokaż całą stronę"
          aria-pressed={zoom === null}
          className={`top-bar-fit flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium ${
            zoom === null ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9V4h5" />
            <path d="M20 9V4h-5" />
            <path d="M4 15v5h5" />
            <path d="M20 15v5h-5" />
          </svg>
          <span className="top-bar-fit-label">Cała strona</span>
        </button>
      </div>

      <div className="top-bar-actions flex items-center gap-1.5 ml-auto">
        <span className="top-bar-save-status text-xs text-gray-400 whitespace-nowrap" role="status">
          {saveStatus === 'saved' && (
            <span className="text-green-600 font-medium" title="Zapisano w tej przeglądarce">
              ✔<span className="top-bar-save-label"> zapisano</span>
            </span>
          )}
          {saveStatus === 'saving' && (
            <span title="Zapisywanie...">
              …<span className="top-bar-save-label"> zapisywanie</span>
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={onPrint}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 whitespace-nowrap ml-2"
        >
          <span className="top-bar-print-long">Drukuj / Zapisz PDF</span>
          <span className="top-bar-print-short">Drukuj</span>
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
