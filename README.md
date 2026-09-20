# WorksheetLab

**WorksheetLab** to prosty kreator kart pracy A4 dla nauczycieli. Aplikacja działa
w całości w przeglądarce — bez backendu i bez logowania. Projekt jest
automatycznie zapisywany lokalnie w przeglądarce; obrazy, tekst i ustawienia
nie są wysyłane na serwer.

Projekt powstał jako narzędzie edukacyjne — do nauki Reacta, TypeScriptu i
GitHub Actions, dlatego kod jest celowo prosty i czytelny.

## Funkcje

- Wybór jednego z 17 szablonów karty pracy, m.in.:
  - **Wybierz** — polecenie + od 2 do 12 obrazów/emoji do wyboru (6 w trybie
    prostym), w układzie „Rząd” (równa linia) lub „Rozrzucone” (elementy
    porozrzucane po kartce, rozmieszczane automatycznie niezależnie od liczby
    elementów),
  - **Połącz w parę** — dwie kolumny elementów z miejscem na rysowanie linii,
  - **Policz** — jeden element powtórzony 1–10 razy + pole na odpowiedź,
  - **Tak / Nie** — jeden element, pytanie nad nim i dwa duże pola odpowiedzi,
  - **Co nie pasuje?** — od 2 do 12 elementów (6 w trybie prostym), uczeń
    wskazuje ten niepasujący,
  - **Sekwencja** — wzór z 2–4 elementów powtórzony do 12 razy + puste pola
    do uzupełnienia na końcu,
  - **Kartoniki do wycinania** — od 2 do 12 elementów w siatce równych
    kartoników, z opcjonalną przerywaną ramką ułatwiającą wycinanie,
  - **Taki sam / inny** — jeden element wzorcowy (wizualnie odseparowany
    ramką) i do 12 odpowiedzi do porównania (6 w trybie prostym); tasowanie
    dotyczy tylko odpowiedzi, wzorzec zawsze zostaje na miejscu.
  - **Nauka pisania**, **Szlaczki**, **Wykreślanka**, **Krzyżówka**, **Labirynt**,
    **Kolorowanka**, **Działania**, **Połącz kropki** i **Zegar**.
- Orientacja kartki A4: pionowa lub pozioma, wspólna dla wszystkich stron
  projektu. To ograniczenie zapewnia poprawny zapis wielostronicowego projektu
  przez systemowy dialog drukowania/PDF.
- **Tryb prosty** — globalny przełącznik powiększający polecenie, elementy i
  odstępy (przydatny dla młodszych uczniów); w tym trybie limit liczby
  elementów jest niższy, żeby karta była czytelna.
- Płynny suwak rozmiaru elementów (globalny, dla wszystkich szablonów) oraz
  możliwość ustawienia własnego rozmiaru pojedynczego elementu, z przyciskiem
  „Ujednolić rozmiar wszystkich elementów”, który cofa indywidualne rozmiary
  do wartości globalnej.
- Opcjonalny podpis tekstowy pod każdym elementem, z możliwością ukrycia —
  przy dodawaniu obrazu/emoji podpis jest od razu proponowany na podstawie
  nazwy pliku lub nazwy emoji, ale można go dowolnie zmienić.
- Duplikowanie elementu (i pary) jednym kliknięciem.
- Dodawanie własnych obrazów (PNG, JPG/JPEG, WebP) z dysku — obrazy nie są
  nigdzie wysyłane, są tylko wczytywane lokalnie w przeglądarce.
- Wbudowany picker emoji (ok. 130 emoji, 8 kategorii, wyszukiwarka po polskich
  nazwach i słowach kluczowych).
- Podgląd kartki A4 w proporcjach rzeczywistej strony.
- Opcjonalny nagłówek karty — tytuł oraz pola „Imię i nazwisko”, „Data”,
  „Klasa” (z edytowalnymi etykietami), wspólny dla wszystkich szablonów.
- Zmiana kolejności elementów (przesuwanie w górę/w dół), usuwanie elementów.
- Losowanie kolejności elementów (dla szablonów, gdzie ma to sens).
- **Eksport i import projektu do pliku `.json`** — pozwala zapisać kartę na
  dysku i wczytać ją ponownie później; import zachowuje identyfikatory stron,
  a brakujące lub zdublowane zastępuje nowymi.
- Drukowanie / zapis do PDF przez systemowy mechanizm drukowania przeglądarki
  (`window.print()`), z osobnymi stylami `@media print`, które ukrywają
  interfejs edytora i zostawiają tylko kartkę A4 w wybranej orientacji.

## Stack technologiczny

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) jako bundler i serwer deweloperski
- [Tailwind CSS](https://tailwindcss.com/) (v4, przez `@tailwindcss/vite`) do
  stylowania
- GitHub Actions + GitHub Pages do automatycznego wdrażania

Brak backendu, brak bazy danych, brak logowania, brak AI/API.

## Uruchomienie lokalne

Wymagany Node.js (zalecane 20+).

```bash
npm install
npm run dev
```

Aplikacja wystartuje pod adresem podanym w konsoli (domyślnie
`http://localhost:5173/worksheetlab/`).

## Budowanie produkcyjne

```bash
npm run build
npm run lint
npm run test
```

Zbudowana wersja statyczna trafia do katalogu `dist/`. Podgląd builda lokalnie:

```bash
npm run preview
```

## GitHub Pages

Projekt jest skonfigurowany do hostowania pod adresem w stylu:

```
https://USERNAME.github.io/worksheetlab/
```

W `vite.config.ts` ustawiona jest opcja `base: '/worksheetlab/'`, dopasowana do
nazwy repozytorium. Jeśli repozytorium nazywa się inaczej, zmień tę wartość
oraz ścieżki fontów w `src/index.css`.

Wdrożenie odbywa się automatycznie: workflow
`.github/workflows/deploy.yml` przy każdym pushu do gałęzi `main`:

1. instaluje zależności (`npm ci`),
2. buduje projekt (`npm run build`),
3. uruchamia lint i testy,
4. publikuje katalog `dist` na GitHub Pages.

W ustawieniach repozytorium (Settings → Pages) należy ustawić źródło jako
**GitHub Actions**.

## Struktura projektu

```
src/
  components/
    Editor/            panel edycji karty
    WorksheetPreview/  podgląd kartki A4
    EmojiPicker/       picker emoji z wyszukiwarką
    ImageUploader/      wczytywanie własnych obrazów
  templates/
    *Template.tsx      implementacje wszystkich generatorów
  data/
    emojis.ts          biblioteka ~130 emoji z polskimi nazwami
  types/
    worksheet.ts        wspólny model danych (WorksheetItem, WorksheetState)
  worksheetIO.ts          eksport/import i migracje projektu .json
  worksheetIO.test.ts     testy importu projektu
  utils.ts               drobne funkcje pomocnicze (id, tasowanie)
scripts/legacy/           zachowane jednorazowe skrypty migracyjne
```

## Eksport i import projektu

Przycisk **„Eksportuj projekt”** pobiera cały bieżący stan karty (szablon,
polecenie, elementy, obrazy jako Data URL, ustawienia) jako plik `.json`.
Przycisk **„Importuj projekt”** wczytuje taki plik z powrotem. Import
sprawdza podstawową strukturę pliku — błędny lub obcy JSON pokazuje czytelny
komunikat zamiast wywalać aplikację. Identyfikatory potrzebne do przeciągania
stron są zachowywane, a brakujące albo zduplikowane są naprawiane.

## Świadomie pozostawione poza MVP

- Generowanie PDF bibliotekami typu `jsPDF`/`html2canvas` — na razie
  wystarcza systemowy druk przeglądarki.
- Pełna biblioteka emoji Unicode (obecnie ok. 130 najpopularniejszych).
- Logowanie, konta użytkowników, backend, baza danych.
