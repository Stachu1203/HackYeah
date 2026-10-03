# Role zespołu (4 osoby)

## 1) Frontend Lead — mapa + motion
- `/` mapa Leaflet, piny, heatmap mode na `/admin`
- Animacje: pin/list pulse przy upvote, heat bars, toasty
- Projector: duże markery, czytelny kontrast

## 2) Product UI — UX PL + dostępność
- Typografia (Fraunces + Source Sans 3), mikrocopy po polsku
- Formularz zgłoszenia, karty innowacji, stany puste/ładowania
- WCAG: focus-visible, `lang=pl`, aria-label na mapie i listach, duży tekst

## 3) Backend / AI — match + petition
- `src/lib/match.ts` — keyword + category score
- `src/lib/petition.ts` + `/api/petition` — wniosek art. 241 KPA
- Seed: 12 zgłoszeń, 10 innowacji w `src/lib/seed.ts`
- Mailto jako „Wyślij” (bez ePUAP)

## 4) Pitch Captain — story + slajdy
- Skrypt 3 min: [DEMO.md](./DEMO.md)
- Max 10 slajdów: [SLIDES.md](./SLIDES.md)
- Próby na projektorze; backup nagrania ekranu
- Odpowiedzi jury: WCAG, skalowanie, koszt utrzymania, dane (seed)

## Opus 5.5 (linie do pitchu)

Budowaliśmy z Opus 5.5 jako asystentem implementacji i generatorem wniosków — walidacja i UX są nasze.

Użycie:
- szybkie komponenty React + motion
- polski copy / teksty wniosków
- skrypt prezentacji (edytowany przez ludzi)
