import { useEffect, useRef } from 'react'
import { BUY_COFFEE } from '../support'

interface SupportThankYouModalProps {
  isOpen: boolean
  onPostpone: () => void
  onDisable: () => void
}

/** Komunikat po zakończeniu dialogu drukowania; nie ingeruje w sam wydruk. */
export function SupportThankYouModal({ isOpen, onPostpone, onDisable }: SupportThankYouModalProps) {
  const dismissRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dismissRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onPostpone()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      previouslyFocused.current?.focus()
    }
  }, [isOpen, onPostpone])

  if (!isOpen) return null

  return (
    <div className="support-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onPostpone()}>
      <section className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
        <button type="button" className="support-modal-close" onClick={onPostpone} aria-label="Zamknij komunikat wsparcia">
          ×
        </button>
        <h2 id="support-modal-title">Karta gotowa! ☕</h2>
        <p>KartoLab jest darmowy i taki zostanie. Jeśli właśnie zaoszczędził Ci trochę czasu, możesz postawić mi kawę i wesprzeć rozwój kolejnych narzędzi edukacyjnych.</p>
        <div className="support-modal-options">
          {BUY_COFFEE.options.map((option) => (
            <a key={option.label} href={option.url} target="_blank" rel="noopener noreferrer" onClick={onPostpone}>
              <img src={option.iconUrl} alt="" width="24" height="24" />
              <span>{option.label}</span>
              <strong>{option.amount}</strong>
            </a>
          ))}
        </div>
        <div className="support-modal-actions">
          <button ref={dismissRef} type="button" onClick={onPostpone}>Nie teraz</button>
          <button type="button" onClick={onDisable}>Nie pokazuj ponownie</button>
        </div>
      </section>
    </div>
  )
}
