# KartaLab

**KartaLab** to prosty kreator kart pracy A4 dla nauczycieli. Aplikacja działa
w całości w przeglądarce — bez backendu, bez logowania, bez zapisywania
czegokolwiek na serwerze. Wszystko, co robi użytkownik (obrazy, tekst,
wybory), pozostaje wyłącznie w pamięci przeglądarki i znika po odświeżeniu
strony.

Projekt powstał jako narzędzie edukacyjne — do nauki Reacta, TypeScriptu i
GitHub Actions, dlatego kod jest celowo prosty i czytelny.

## Funkcje (MVP)

- Wybór jednego z 3 szablonów karty pracy:
  - **Wybierz** — polecenie + od 2 do 6 obrazów/emoji do wyboru,
  - **Połącz w parę** — dwie kolumny elementów z miejscem na rysowanie linii,
  - **Policz** — jeden element powtórzony 1–10 razy + pole na odpowiedź.
- Dodawanie własnych obrazów (PNG, JPG/JPEG, WebP) z dysku — obrazy nie są
  nigdzie wysyłane, są tylko wczytywane lokalnie w przeglądarce.
- Wbudowany picker emoji (ok. 130 emoji, 8 kategorii, wyszukiwarka po polskich
  nazwach i słowach kluczowych).
- Podgląd kartki A4 w proporcjach rzeczywistej strony.
- Zmiana kolejności elementów (przesuwanie w górę/w dół), usuwanie elementów.
- Losowanie kolejności elementów (dla szablonów, gdzie ma to sens).
- Drukowanie / zapis do PDF przez systemowy mechanizm drukowania przeglądarki
  (`window.print()`), z osobnymi stylami `@media print`, które ukrywają
  interfejs edytora i zostawiają tylko kartkę A4.

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
`http://localhost:5173/kartalab/`).

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
https://USERNAME.github.io/kartalab/
```

W `vite.config.ts` ustawiona jest opcja `base: '/kartalab/'`, dopasowana do
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
  data/
    emojis.ts          biblioteka ~130 emoji z polskimi nazwami
  types/
    worksheet.ts        wspólny model danych (WorksheetItem, WorksheetState)
  utils.ts               drobne funkcje pomocnicze (id, tasowanie)
```

## Świadomie pozostawione poza MVP

- Trwałe zapisywanie projektów (np. w `localStorage` albo eksport/import
  pliku) — na razie karta znika po odświeżeniu strony.
- Drag and drop przy zmianie kolejności elementów.
- Generowanie PDF bibliotekami typu `jsPDF`/`html2canvas` — na razie
  wystarcza systemowy druk przeglądarki.
- Więcej niż 3 szablony kart oraz pełna biblioteka emoji Unicode.
- Logowanie, konta użytkowników, backend, baza danych.
