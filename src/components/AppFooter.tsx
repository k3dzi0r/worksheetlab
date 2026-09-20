/** Minimalna stopka aplikacji, poza panelem podglądu i poza wydrukiem. */
export function AppFooter() {
  return (
    <footer className="app-footer print:hidden">
      <span>KartoLab · Darmowy generator kart pracy</span>
      <span>Stworzył Adrian Kędzior</span>
    </footer>
  )
}
