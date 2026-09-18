import { useRef } from 'react'

interface TopBarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onPrint: () => void
  onExport: () => void
  onImport: (text: string) => void
  onClear: () => void
  showAnswerKey: boolean
  onToggleAnswerKey: () => void
  /** Losowanie kolejności ma sens tylko w części szablonów. */
  showShuffle: boolean
  onShuffle: () => void
  saveStatus: 'saved' | 'saving' | 'idle'
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
  onExport,
  onImport,
  onClear,
  showAnswerKey,
  onToggleAnswerKey,
  showShuffle,
  onShuffle,
  saveStatus,
}: TopBarProps) {
  const importInputRef = useRef<HTMLInputElement>(null)

  function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // pozwala zaimportować ten sam plik ponownie
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onImport(reader.result)
    }
    reader.readAsText(file)
  }

  return (
    <div className="print:hidden w-full bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap">
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

      <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-800 hover:bg-gray-100 cursor-pointer">
        <input
          type="checkbox"
          checked={showAnswerKey}
          onChange={onToggleAnswerKey}
          className="w-4 h-4 cursor-pointer"
        />
        Klucz odpowiedzi
      </label>

      {showShuffle && (
        <button
          type="button"
          onClick={onShuffle}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
        >
          Losuj kolejność
        </button>
      )}

      <div className="flex-1" />

      <span className="text-xs text-gray-400 min-w-[7rem] text-right">
        {saveStatus === 'saved' && <span className="text-green-600 font-medium">✔ Zapisano lokalnie</span>}
        {saveStatus === 'saving' && 'Zapisywanie...'}
      </span>

      <button
        type="button"
        onClick={() => importInputRef.current?.click()}
        className="px-3 py-1.5 rounded-lg text-sm text-gray-800 border border-gray-300 hover:bg-gray-100"
      >
        Wczytaj
      </button>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={onExport}
        className="px-3 py-1.5 rounded-lg text-sm text-gray-800 border border-gray-300 hover:bg-gray-100"
      >
        Eksportuj
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm('Czy na pewno chcesz usunąć wszystko i zacząć od nowa?')) onClear()
        }}
        className="px-3 py-1.5 rounded-lg text-sm text-red-700 border border-red-200 hover:bg-red-50"
      >
        Wyczyść
      </button>
      <button
        type="button"
        onClick={onPrint}
        className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700"
      >
        Drukuj / Zapisz PDF
      </button>
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
      className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <svg
        width="20"
        height="20"
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
