# ImpaktMałopolska — HubMI

iOS-style tablica zgłoszeń: zdjęcie + lokalizacja → upvote → matchmaking → wniosek → panel urzędu (heatmapa).

## Start

```bash
cd impakt-malopolska
npm install
npm run dev
```

## Co jest w MVP

| | |
|---|---|
| `/` | Tablica (feed) + mapa · FAB dodawania |
| Dodaj | Zdjęcie (kamera/galeria) · GPS lub pin na mapie |
| `/zgloszenie/[id]` | Dopasowanie innowacji + wniosek art. 241 KPA |
| `/admin` | Heatmapa + kolejka (rola **Urząd** w nav) |
| Role | Mieszkaniec / Urząd — przełącznik demo (bez kontenerów/DB) |

## Zespół

[TEAM.md](./TEAM.md) · [DEMO.md](./DEMO.md) · [SLIDES.md](./SLIDES.md) · [SHARE.txt](./SHARE.txt)

Slajdy PDF: `/slajdy` (Ctrl+P) — nie w nawigacji; tylko do submission.
