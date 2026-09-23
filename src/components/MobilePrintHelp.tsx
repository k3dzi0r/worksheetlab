import { useEffect, useRef } from 'react'

const DISMISS_KEY = 'kartolab-mobile-print-help-dismissed'

/** Telefon albo tablet - tam okno drukowania wygląda inaczej i warto podpowiedzieć, jak zapisać PDF. */
export function shouldShowMobilePrintHelp(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia('(pointer: coarse)').matches) return false
  try {
    return window.localStorage.getItem(DISMISS_KEY) !== '1'
  } catch {
    return true
  }
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Aplikacja dodana do ekranu początkowego iPhone'a - tam druk bywa zablokowany. */
function isIosStandalone(): boolean {
  return isIos() && (navigator as Navigator & { standalone?: boolean }).standalone === true
}

interface MobilePrintHelpProps {
  isOpen: boolean
  onPrint: () => void
  onClose: () => void
}

/** Krótka instrukcja przed drukiem na telefonie: gdzie w systemowym oknie jest „Zapisz jako PDF". */
export function MobilePrintHelp({ isOpen, onPrint, onClose }: MobilePrintHelpProps) {
  const printRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    printRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const ios = isIos()

  function dismissForever() {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Brak dostępu do pamięci przeglądarki - pokażemy podpowiedź następnym razem.
    }
    onPrint()
  }

  return (
    <div className="support-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="support-modal" role="dialog" aria-modal="true" aria-labelledby="print-help-title">
        <button type="button" className="support-modal-close" onClick={onClose} aria-label="Zamknij">
          ×
        </button>
        <h2 id="print-help-title">Drukowanie z telefonu</h2>
        <ol className="print-help-steps">
          {ios ? (
            <>
              <li>Za chwilę otworzy się okno drukowania.</li>
              <li>Wybierz drukarkę albo stuknij ikonę udostępniania u góry.</li>
              <li>„Zachowaj w Plikach" zapisze kartę jako PDF.</li>
            </>
          ) : (
            <>
              <li>Za chwilę otworzy się okno drukowania.</li>
              <li>Na górze wybierz drukarkę albo „Zapisz jako PDF".</li>
              <li>Stuknij niebieski przycisk PDF / Drukuj.</li>
            </>
          )}
        </ol>
        {isIosStandalone() && (
          <p className="print-help-note">
            Jeśli okno drukowania się nie pojawi, otwórz KartoLab w Safari. Projekt zostaje w tej przeglądarce, a do Safari
            przeniesiesz go przez Więcej → Eksportuj / Wczytaj.
          </p>
        )}
        <div className="support-modal-actions">
          <button ref={printRef} type="button" onClick={onPrint}>
            Drukuj
          </button>
          <button type="button" onClick={dismissForever}>
            Drukuj i nie pokazuj więcej
          </button>
        </div>
      </section>
    </div>
  )
}
