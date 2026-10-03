# ImpaktMałopolska — HubMI

iOS-style tablica zgłoszeń: zdjęcie + lokalizacja → upvote → matchmaking → wniosek → panel urzędu (heatmapa).

## Struktura

| Folder | Zawartość |
|---|---|
| `frontend/` | Vite + React + TypeScript + Tailwind, Leaflet (mapy), React Router |
| `backend/` | Flask — REST API pod `/api` |
| `database/` | Surowy SQL dla SQLite: `schema.sql`, `seed.sql`, `queries.sql` |

## Start

Backend (port 5001):

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # konfiguracja: klucz sesji, konto urzędu
.venv/bin/python app.py
```

Frontend (port 5173, `/api` przekierowane na backend):

```bash
cd frontend
npm install
npm run dev
```

Baza `backend/impakt.db` tworzy się sama przy pierwszym starcie. Ręczny reset:
`cd backend && .venv/bin/flask --app app init-db` albo przycisk „Reset” w panelu urzędu.

## API

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/api/issues` | Lista zgłoszeń (najnowsze pierwsze) |
| POST | `/api/issues` | Nowe zgłoszenie (wymaga konta) |
| GET | `/api/issues/<id>` | Jedno zgłoszenie |
| POST / DELETE | `/api/issues/<id>/upvote` | Poparcie / cofnięcie (jeden głos na konto); od 20 głosów `READY_TO_SEND` |
| POST | `/api/issues/<id>/sent` | Oznacz jako wysłane (wymaga konta) |
| GET | `/api/issues/<id>/matches` | Top 3 podobnych innowacji |
| POST | `/api/issues/<id>/petition` | Wniosek z art. 241 KPA |
| POST | `/api/reset` | Odtworzenie danych demo z seeda (tylko admin; konta zostają) |
| POST | `/api/auth/register` | Rejestracja i zalogowanie |
| POST | `/api/auth/login` · `/api/auth/logout` | Logowanie / wylogowanie |
| GET | `/api/auth/me` | Zalogowany użytkownik albo `null` |

## Jak to działa

- **Matchmaking na embeddingach.** Każde zgłoszenie i innowacja dostaje wektor (512 wymiarów, BLOB w SQLite).
  Embeddingi są liczone lokalnie (feature hashing słów i n-gramów znakowych — łapie polską odmianę),
  bez modelu i klucza API. Wynik = podobieństwo cosinusowe + premia za tę samą kategorię.
  Funkcję `embed()` w `backend/embeddings.py` można podmienić na prawdziwy model bez zmian w bazie i API.
- **Zgłoszenia wygasają po 7 dniach.** Backend usuwa starsze zgłoszenia przy starcie i najwyżej raz
  na minutę przy kolejnych żądaniach (`purge_old_issues` w `database/queries.sql`).
  Seed ma daty względne, więc po resecie dane demo są zawsze świeże.
- **Konta.** Hasła hashowane (werkzeug/scrypt), sesja w podpisanym ciasteczku (httpOnly, 30 dni).
  Klucz sesji: `IMPAKT_SECRET_KEY` albo plik `backend/.secret_key` tworzony przy pierwszym starcie.
  Przeglądać może każdy; dodawanie i popieranie zgłoszeń wymaga konta.
- **Konto urzędu** zakłada się samo: login `meow`, hasło `meow_meow`
  (nadpisz zmiennymi `IMPAKT_ADMIN_USERNAME` / `IMPAKT_ADMIN_PASSWORD` przed pierwszym startem).

## Widoki

| | |
|---|---|
| `/` | Tablica (feed) + mapa · FAB dodawania |
| Dodaj | Zdjęcie (kamera/galeria) · GPS lub pin na mapie |
| `/zgloszenie/:id` | Dopasowanie innowacji + wniosek art. 241 KPA |
| `/admin` | Heatmapa + kolejka (tylko konto urzędu) |
| `/logowanie` | Logowanie i rejestracja |
| `/slajdy` | Slajdy do PDF (Ctrl+P) — nie w nawigacji; tylko do submission |

## Zespół

[TEAM.md](./TEAM.md) · [DEMO.md](./DEMO.md) · [SLIDES.md](./SLIDES.md) · [SHARE.txt](./SHARE.txt)
