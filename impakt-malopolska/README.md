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
| POST | `/api/issues` | Nowe zgłoszenie z maks. 4 zdjęciami; przed zapisem moderacja JEV (wymaga konta) |
| DELETE | `/api/issues/<id>` | Usunięcie (autor albo urząd) |
| GET | `/api/images/<id>` | Zdjęcie zgłoszenia |
| GET | `/api/issues/<id>` | Jedno zgłoszenie |
| PUT | `/api/issues/<id>/vote` | Głos `1` / `-1` / `0` (jeden na konto); wynik = za − przeciw, od 20 `READY_TO_SEND` |
| POST | `/api/issues/<id>/sent` | Oznacz jako wysłane (wymaga konta) |
| GET | `/api/issues/<id>/matches` | Top 3 podobnych innowacji |
| POST | `/api/issues/<id>/petition` | Wniosek z art. 241 KPA |
| POST | `/api/reset` | Odtworzenie danych demo z seeda (tylko admin; konta zostają) |
| POST | `/api/auth/register` | Rejestracja i zalogowanie |
| POST | `/api/auth/login` · `/api/auth/logout` | Logowanie / wylogowanie |
| GET | `/api/auth/me` | Zalogowany użytkownik albo `null` |
| PUT | `/api/auth/me/location` | Okolica konta (domyślny filtr tablicy) |
| POST | `/api/reports` | Zgłoszenie nadużycia (post albo komentarz) |
| GET | `/api/admin/reports` · `/api/admin/bans` | Kolejka zgłoszeń i zablokowane konta (urząd) |
| POST | `/api/admin/reports/<id>/resolve` · `/dismiss` | Usuń treść / zablokuj autora / odrzuć |
| POST | `/api/admin/users/<id>/unban` | Odblokowanie konta |

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
- **Moderacja JEV.** Model przez OpenRouter sprawdza zgłoszenia (tytuł, opis i zdjęcia przy „Przypnij do tablicy”),
  komentarze przed zapisem oraz login i podpis przy rejestracji (wulgaryzmy, podszywanie się pod urząd, reklamy)
  — klucz `JEV_TOKEN`, opcjonalnie `JEV_MODEL` w `backend/.env`. Obraźliwe treści, dane osobowe i spam są odrzucane (HTTP 422).
  Gdy OpenRouter nie odpowiada, post przechodzi (zapis w logu) — żeby demo nie stanęło bez sieci.
  Nieczytelne zdjęcie blokuje publikację, więc uszkodzonym plikiem nie da się ominąć moderacji.
- **Lokalizacja.** Konto może mieć okolicę (przy rejestracji albo w „Moje konto”); tablica domyślnie
  pokazuje zgłoszenia do 25 km od niej. Filtry: promień, miejscowość; sortowanie: najnowsze, najlepsze, najbliżej.
- **Zgłoszenia nadużyć i bany.** Zalogowani zgłaszają posty i komentarze; urząd w panelu usuwa treść,
  blokuje autora albo odrzuca zgłoszenie. Zablokowane konto nie zaloguje się ani nie doda treści.
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
