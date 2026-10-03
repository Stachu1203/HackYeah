# ImpaktMałopolska — HubMI

Tablica sąsiedzka dla Małopolski: zgłoszenie ze zdjęciami i lokalizacją → głosy za/przeciw i komentarze → dopasowanie sprawdzonej innowacji z innej gminy → wniosek z art. 241 KPA → panel urzędu (heatmapa, moderacja).

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
cp .env.example .env   # klucz sesji, konto urzędu, JEV_TOKEN (OpenRouter) do moderacji
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
| GET | `/api/issues/<id>/comments` | Komentarze pod zgłoszeniem |
| POST | `/api/issues/<id>/comments` | Nowy komentarz; przed zapisem moderacja JEV (wymaga konta) |
| DELETE | `/api/comments/<id>` | Usunięcie komentarza (autor albo urząd) |
| GET | `/api/issues/<id>/matches` | Top 3 podobnych innowacji |
| POST | `/api/issues/<id>/petition` | Wniosek z art. 241 KPA |
| POST | `/api/reset` | Odtworzenie danych demo z seeda (tylko admin; konta zostają) |
| POST | `/api/auth/register` | Rejestracja (opcjonalnie z okolicą) i zalogowanie; login i podpis sprawdza JEV |
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
  Przeglądać może każdy; dodawanie zgłoszeń, głosowanie, komentowanie i zgłaszanie nadużyć wymaga konta.
- **Moderacja JEV.** Model przez OpenRouter sprawdza zgłoszenia (tytuł, opis i zdjęcia przy „Przypnij do tablicy”),
  komentarze przed zapisem oraz login i podpis przy rejestracji (wulgaryzmy, podszywanie się pod urząd, reklamy)
  — klucz `JEV_TOKEN`, opcjonalnie `JEV_MODEL` w `backend/.env`. Obraźliwe treści, dane osobowe i spam są odrzucane (HTTP 422).
  Gdy OpenRouter nie odpowiada, post przechodzi (zapis w logu) — żeby demo nie stanęło bez sieci.
  Nieczytelne zdjęcie blokuje publikację, więc uszkodzonym plikiem nie da się ominąć moderacji.
- **Lokalizacja.** Konto może mieć okolicę (przy rejestracji albo w „Moje konto”); tablica domyślnie
  pokazuje zgłoszenia do 25 km od niej. Filtry: promień, miejscowość; sortowanie: najnowsze, najlepsze, najbliżej.
- **Zgłoszenia nadużyć i bany.** Zalogowani zgłaszają posty i komentarze; urząd w panelu usuwa treść,
  blokuje autora albo odrzuca zgłoszenie. Zablokowane konto nie zaloguje się ani nie doda treści.
- **Zdjęcia.** Do 4 na zgłoszenie; przeglądarka zmniejsza je do JPEG ≤ 1600 px / 1,5 MB, backend sprawdza
  sygnaturę pliku i trzyma bajty w tabeli `issue_images` (serwowane pod `/api/images/<id>`).
- **Kawaii mode** zamiast dark mode — przycisk z serduszkiem w nawigacji, zapamiętywany w przeglądarce:
  pastelowy motyw, kotek w logo, japońskie zwroty, a każdy komentarz wyświetla się z dopiskiem „meow meow”
  (w zwykłym trybie ten dopisek jest zawsze ukryty; w bazie zostaje oryginalna treść).
- **Konto urzędu** zakłada się samo: login `meow`, hasło `meow_meow`
  (nadpisz zmiennymi `IMPAKT_ADMIN_USERNAME` / `IMPAKT_ADMIN_PASSWORD` przed pierwszym startem).

## Widoki

| | |
|---|---|
| `/` | Tablica + mapa · filtr okolicy (promień, miejscowość) · sortowanie najnowsze/najlepsze/najbliżej · „Pokaż mnie” na mapie · FAB dodawania |
| Dodaj | Do 4 zdjęć · GPS lub pin na mapie (domyślnie okolica z konta) · moderacja JEV przy „Przypnij do tablicy” |
| `/zgloszenie/:id` | Galeria · głosy ▲/▼ · dopasowanie innowacji · wniosek art. 241 KPA · komentarze · „Zgłoś” / „Usuń” |
| `/admin` | Heatmapa, kolejka wniosków, zgłoszenia nadużyć i zablokowane konta (tylko konto urzędu) |
| `/logowanie` | Logowanie i rejestracja; po zalogowaniu „Moje konto” z ustawieniem okolicy |
| `/slajdy` | Slajdy do PDF (Ctrl+P) — nie w nawigacji; tylko do submission |

## Zespół

[TEAM.md](./TEAM.md) · [DEMO.md](./DEMO.md) · [SLIDES.md](./SLIDES.md) · [SHARE.txt](./SHARE.txt)
