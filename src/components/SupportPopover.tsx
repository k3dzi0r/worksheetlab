import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BUY_COFFEE } from '../support'

/** Widoczny w pasku narzędzi, lekki wybór dobrowolnego wsparcia. */
export function SupportPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(320, window.innerWidth - 32)
      const fitsOnRight = rect.right + 12 + width <= window.innerWidth - 16
      const left = fitsOnRight ? rect.right + 12 : Math.max(16, Math.min(rect.left, window.innerWidth - width - 16))
      const top = Math.max(16, Math.min(rect.top, window.innerHeight - 320))
      setPosition({ left, top })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) setIsOpen(false)
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
      {isOpen && createPortal(
        <section
          ref={popoverRef}
          id="support-popover"
          className="support-popover support-popover-floating"
          role="dialog"
          aria-labelledby="support-popover-title"
          style={position ? { left: position.left, top: position.top } : { visibility: 'hidden' }}
        >
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
        </section>,
        document.body,
      )}
    </div>
  )
}
