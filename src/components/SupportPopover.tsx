import { useEffect, useRef, useState } from 'react'
import { BUY_COFFEE } from '../support'

/** Widoczny w pasku narzędzi, lekki wybór dobrowolnego wsparcia. */
export function SupportPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div ref={rootRef} className="support-popover-root">
      <button
        ref={buttonRef}
        type="button"
        className="support-trigger"
        aria-expanded={isOpen}
        aria-controls="support-popover"
        onClick={() => setIsOpen((open) => !open)}
      >
        ☕ Postaw mi kawę
      </button>
      {isOpen && (
        <section id="support-popover" className="support-popover" role="dialog" aria-labelledby="support-popover-title">
          <h2 id="support-popover-title">KartoLab Ci się przydaje?</h2>
          <p>Jeśli chcesz wesprzeć rozwój darmowych narzędzi edukacyjnych, możesz postawić mi kawę. ☕</p>
          <div className="support-option-list">
            {BUY_COFFEE.options.map((option) => (
              <a
                key={option.label}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="support-option"
                onClick={() => setIsOpen(false)}
              >
                <img src={option.iconUrl} alt="" width="22" height="22" />
                <span>{option.label}</span>
                <strong>{option.amount}</strong>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
