

interface HeaderFieldToggleProps {
  checked: boolean
  label: string
  defaultLabel: string
  onToggle: (checked: boolean) => void
  onLabelChange: (label: string) => void
}

/** Przełącznik jednego pola nagłówka (np. "Data") z możliwością zmiany jego etykiety. */
export function HeaderFieldToggle({ checked, label, defaultLabel, onToggle, onLabelChange }: HeaderFieldToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onToggle(event.target.checked)}
          className="w-5 h-5"
        />
      </label>
      <input
        type="text"
        value={label}
        onChange={(event) => onLabelChange(event.target.value)}
        disabled={!checked}
        placeholder={defaultLabel}
        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  )
}

/** Przełącznik on/off z etykietą - wspólny dla szybkich opcji i kroku Edycja. */
export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-700">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
      <span
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
        style={{ backgroundColor: checked ? '#2563eb' : '#d1d5db' }}
      >
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </label>
  )
}
