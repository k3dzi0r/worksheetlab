/** Co ile sprawdzać nową wersję, gdy karta jest długo otwarta (np. cały dzień w szkole). */
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000

/**
 * Rejestruje service worker i woła `onUpdateReady`, gdy nowa wersja jest pobrana i czeka.
 * Zwrócona funkcja `apply` przełącza na nią i przeładowuje stronę.
 */
let isRegistered = false

export function registerServiceWorker(onUpdateReady: (apply: () => void) => void) {
  // W trybie deweloperskim service worker tylko by przeszkadzał (stare pliki z pamięci).
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  // StrictMode odpala efekty dwa razy - rejestrujemy nasłuchy tylko raz.
  if (isRegistered) return
  isRegistered = true

  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })

  const register = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        const notify = (worker: ServiceWorker) => onUpdateReady(() => worker.postMessage('SKIP_WAITING'))

        // Nowa wersja mogła się pobrać już przy poprzedniej wizycie.
        if (registration.waiting && navigator.serviceWorker.controller) notify(registration.waiting)

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            // Brak kontrolera = pierwsza instalacja, nie ma czego odświeżać.
            if (worker.state === 'installed' && navigator.serviceWorker.controller) notify(worker)
          })
        })

        const checkForUpdate = () => registration.update().catch(() => {})
        window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate()
        })
      })
      .catch(() => {
        // Bez service workera aplikacja działa normalnie, tylko nie offline.
      })
  }

  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
