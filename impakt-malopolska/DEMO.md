# Skrypt demo — 3 minuty (PL)

**Otwarcie:** „Impakt wygląda jak tablica sąsiedzka na telefonie — zdjęcie, lokalizacja, poparcie, a urząd dostaje heatmapę i gotowy wniosek.”

## Kliknięcia

1. **0:00** — `/` Tablica: scroll kart ze zdjęciami i autorami.
2. **0:25** — FAB **+** → zdjęcie (lub seed) + „Moja lokalizacja” / pin na mapie → Opublikuj.
3. **0:55** — Heart upvote na karcie; pokaż próg wniosku.
4. **1:20** — Otwórz szczegóły → dopasowana innowacja z innej gminy.
5. **1:50** — Generuj wniosek → Wyślij (mailto).
6. **2:20** — Wyloguj → zaloguj jako urząd (`meow` / `meow_meow`) → `/admin` heatmapa + kolejka „Gotowe”.
7. **2:50** — Zamknięcie: „Nie mapa dla mapy — pętla od mieszkańca do urzędu.”

## Pytania jury

- Dane: Flask + SQLite (surowy SQL, seed), zgłoszenia wygasają po 7 dniach — docelowo Biblioteka Innowacji / Open Data.
- Matchmaking: lokalne embeddingi (bez klucza API), podmienialne na model językowy.
- Auth: konta z hasłem, jeden głos na konto, rola urzędu; produkcja = SSO urzędu / Profil Zaufany.
- Zdjęcia: data URL w SQLite; produkcja = object storage.
