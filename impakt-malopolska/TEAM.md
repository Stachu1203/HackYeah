# Role zespołu (4 osoby)

## 1) Frontend Lead — mapa + motion
- `/` tablica + mapa Leaflet (domek z konta, „Pokaż mnie”), heatmap mode na `/admin`
- Animacje (framer-motion): głosy ▲/▼, heat bars, toasty, karuzela zdjęć; kawaii mode
- Projector: duże markery, czytelny kontrast

## 2) Product UI — UX PL + dostępność
- Typografia (Fraunces + Bricolage Grotesque; Fredoka w kawaii mode), mikrocopy po polsku
- Formularz zgłoszenia (do 4 zdjęć), logowanie/rejestracja z okolicą, komentarze, stany puste/ładowania
- WCAG: focus-visible, `lang=pl`, aria-label na mapie i listach, duży tekst

## 3) Backend / AI — Flask + SQLite + JEV
- `backend/app.py` — REST API; `database/*.sql` — schemat, seed, zapytania (surowy SQL)
- `backend/matching.py` + `embeddings.py` — dopasowanie innowacji na lokalnych embeddingach
- `backend/petition.py` — wniosek art. 241 KPA; mailto jako „Wyślij” (bez ePUAP)
- `backend/jev.py` — moderacja postów, komentarzy i nazw kont (OpenRouter, `JEV_TOKEN` w `.env`)
- `backend/auth.py`, `reports.py` — konta, okolica, zgłoszenia nadużyć, bany
- Seed: 12 zgłoszeń, 10 innowacji, 5 komentarzy w `database/seed.sql`

## 4) Pitch Captain — story + slajdy
- Skrypt 3 min: [DEMO.md](./DEMO.md)
- Max 10 slajdów: [SLIDES.md](./SLIDES.md)
- Próby na projektorze; backup nagrania ekranu
- Odpowiedzi jury: WCAG, skalowanie, koszt utrzymania, dane (seed), moderacja i prywatność (JEV)

## Opus 5.5 (linie do pitchu)

Budowaliśmy z Opus 5.5 jako asystentem implementacji i generatorem wniosków — walidacja i UX są nasze.

Użycie:
- szybkie komponenty React + motion
- polski copy / teksty wniosków
- skrypt prezentacji (edytowany przez ludzi)
