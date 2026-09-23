import { useRef } from 'react'
import { useDialogFocus } from '../hooks/useDialogFocus'
import { BUY_COFFEE } from '../support'

interface SupportThankYouModalProps {
  isOpen: boolean
  onPostpone: () => void
  onDisable: () => void
}

/** Komunikat po zakończeniu dialogu drukowania; nie ingeruje w sam wydruk. */
export function SupportThankYouModal({ isOpen, onPostpone, onDisable }: SupportThankYouModalProps) {
  const dismissRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  useDialogFocus(dialogRef, isOpen, onPostpone, dismissRef)

  if (!isOpen) return null

  return (
    <div className="support-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onPostpone()}>
      <section ref={dialogRef} className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
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
