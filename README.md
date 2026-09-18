# WorksheetLab

**WorksheetLab** to prosty kreator kart pracy A4 dla nauczycieli. Aplikacja działa
w całości w przeglądarce — bez backendu, bez logowania, bez zapisywania
czegokolwiek na serwerze. Wszystko, co robi użytkownik (obrazy, tekst,
wybory), pozostaje wyłącznie w pamięci przeglądarki i znika po odświeżeniu
strony.

Projekt powstał jako narzędzie edukacyjne — do nauki Reacta, TypeScriptu i
GitHub Actions, dlatego kod jest celowo prosty i czytelny.

## Funkcje

- Wybór jednego z 6 szablonów karty pracy:
  - **Wybierz** — polecenie + od 2 do 6 obrazów/emoji do wyboru, w układzie
    „Rząd” (równa linia) lub „Rozrzucone” (elementy porozrzucane po kartce),
  - **Połącz w parę** — dwie kolumny elementów z miejscem na rysowanie linii,
  - **Policz** — jeden element powtórzony 1–10 razy + pole na odpowiedź,
  - **Tak / Nie** — jeden element, pytanie nad nim i dwa duże pola odpowiedzi,
  - **Co nie pasuje?** — od 3 do 6 elementów, uczeń wskazuje ten niepasujący,
  - **Sekwencja** — wzór z 2–4 elementów powtórzony kilka razy + puste pola
    do uzupełnienia na końcu.
- Orientacja kartki A4: pionowa lub pozioma (dotyczy wszystkich szablonów).
- **Tryb prosty** — globalny przełącznik powiększający polecenie, elementy i
  odstępy (przydatny dla młodszych uczniów); w tym trybie limit elementów w
  szablonie „Wybierz”/„Co nie pasuje?” jest niższy, żeby karta była czytelna.
- Kontrola rozmiaru elementów (małe/średnie/duże) tam, gdzie ma to sens.
- Opcjonalny podpis tekstowy pod każdym elementem, z możliwością ukrycia.
- Duplikowanie elementu (i pary) jednym kliknięciem.
- Dodawanie własnych obrazów (PNG, JPG/JPEG, WebP) z dysku — obrazy nie są
  nigdzie wysyłane, są tylko wczytywane lokalnie w przeglądarce.
- Wbudowany picker emoji (ok. 130 emoji, 8 kategorii, wyszukiwarka po polskich
  nazwach i słowach kluczowych).
- Podgląd kartki A4 w proporcjach rzeczywistej strony.
- Zmiana kolejności elementów (przesuwanie w górę/w dół), usuwanie elementów.
- Losowanie kolejności elementów (dla szablonów, gdzie ma to sens).
- **Eksport i import projektu do pliku `.json`** — pozwala zapisać kartę na
  dysku i wczytać ją ponownie później, bez backendu i bez `localStorage`.
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
nazwy repozytorium. Jeśli repozytorium nazywa się inaczej, zmień tę wartość.

Wdrożenie odbywa się automatycznie: workflow
`.github/workflows/deploy.yml` przy każdym pushu do gałęzi `main`:

1. instaluje zależności (`npm ci`),
2. buduje projekt (`npm run build`),
3. publikuje katalog `dist` na GitHub Pages.

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
    ChoiceTemplate.tsx
    MatchPairsTemplate.tsx
    CountTemplate.tsx
    YesNoTemplate.tsx
    OddOneOutTemplate.tsx
    SequenceTemplate.tsx
  data/
    emojis.ts          biblioteka ~130 emoji z polskimi nazwami
  types/
    worksheet.ts        wspólny model danych (WorksheetItem, WorksheetState)
  worksheetIO.ts          eksport/import projektu do/z pliku .json
  utils.ts               drobne funkcje pomocnicze (id, tasowanie)
```

## Eksport i import projektu

Przycisk **„Eksportuj projekt”** pobiera cały bieżący stan karty (szablon,
polecenie, elementy, obrazy jako Data URL, ustawienia) jako plik `.json`.
Przycisk **„Importuj projekt”** wczytuje taki plik z powrotem. Import
sprawdza podstawową strukturę pliku — błędny lub obcy JSON pokazuje czytelny
komunikat zamiast wywalać aplikację. To wciąż nie jest trwały zapis
(np. w chmurze) — to zwykły plik na dysku użytkownika.

## Świadomie pozostawione poza MVP

- Trwałe zapisywanie projektów w `localStorage`/IndexedDB albo w chmurze —
  eksport/import do pliku `.json` już działa, ale karta w przeglądarce
  wciąż znika po odświeżeniu strony, jeśli nie zostanie wyeksportowana.
- Drag and drop przy zmianie kolejności elementów.
- Generowanie PDF bibliotekami typu `jsPDF`/`html2canvas` — na razie
  wystarcza systemowy druk przeglądarki.
- Pełna biblioteka emoji Unicode (obecnie ok. 130 najpopularniejszych).
- Logowanie, konta użytkowników, backend, baza danych.
