import { BUY_COFFEE } from '../support'

/** Dyskretna stopka aplikacji z dobrowolnym wsparciem, poza obszarem wydruku. */
export function AppFooter() {
  return (
    <footer className="app-footer print:hidden">
      <div>
        <p className="font-semibold text-gray-800">KartoLab</p>
        <p className="text-xs text-gray-500">Darmowy generator kart pracy</p>
        <p className="text-xs text-gray-400 mt-1">Stworzył {BUY_COFFEE.creator}</p>
      </div>
      <details className="support-details">
        <summary>☕ Postaw mi kawę</summary>
        <div className="support-options">
          <p>KartoLab jest darmowy i taki pozostanie. Jeśli ułatwia Ci pracę, możesz wesprzeć jego dalszy rozwój.</p>
          <div className="support-option-list">
            {BUY_COFFEE.options.map((option) => (
              <a key={option.label} href={option.url} target="_blank" rel="noopener noreferrer" className="support-option">
                <img src={option.iconUrl} alt="" width="22" height="22" />
                <span>{option.label}</span>
                <strong>{option.amount}</strong>
              </a>
            ))}
          </div>
        </div>
      </details>
      <a href={BUY_COFFEE.profileUrl} target="_blank" rel="noopener noreferrer" className="support-link">
        ☕ Postaw mi kawę
      </a>
    </footer>
  )
}
