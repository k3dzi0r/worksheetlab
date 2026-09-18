import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Mierzy, ile miejsca zostało na kartce A4 od górnej krawędzi danego elementu
 * do dolnej krawędzi zadruku. Dzięki temu szablony wypełniające stronę (liniatura,
 * labirynt) nigdy nie wychodzą poza kartkę - niezależnie od nagłówka, polecenia
 * i orientacji strony.
 */
export function usePageSpace(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [space, setSpace] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const page = el.closest('.worksheet-a4') as HTMLElement | null

    const measure = () => {
      const width = el.clientWidth
      let height = 0
      if (page) {
        const pageRect = page.getBoundingClientRect()
        const paddingBottom = parseFloat(getComputedStyle(page).paddingBottom) || 0
        height = pageRect.bottom - paddingBottom - el.getBoundingClientRect().top
      }
      setSpace((prev) =>
        Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5 ? prev : { width, height },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (page) observer.observe(page)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { containerRef, ...space }
}
