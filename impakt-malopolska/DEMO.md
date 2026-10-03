# Skrypt demo — 3 minuty (PL)

**Otwarcie:** „Impakt wygląda jak tablica sąsiedzka na telefonie — zdjęcia, lokalizacja, głosy sąsiadów, a urząd dostaje heatmapę, gotowy wniosek i czystą, moderowaną tablicę.”

## Kliknięcia

Przed demo: zaloguj się na konto mieszkańca z ustawioną okolicą (np. Kraków).

1. **0:00** — `/` Tablica: domyślnie zgłoszenia z okolicy konta; przełącz sortowanie na „Najlepsze”, przewiń karty.
2. **0:20** — FAB **+** → 2 zdjęcia + pin na mapie → „Przypnij do tablicy” (JEV sprawdza treść).
3. **0:45** — Moderacja na żywo: spróbuj przypiąć obraźliwy wpis z numerem telefonu → „Zgłoszenie nie zostało zaakceptowane: …”.
4. **1:05** — Głos ▲ / ▼ na karcie; pokaż wynik netto i próg wniosku (20).
5. **1:25** — Szczegóły → dopasowana innowacja z innej gminy → komentarz pod zgłoszeniem.
6. **1:50** — „Napisz wniosek (art. 241 KPA)” → Wyślij (mailto).
7. **2:15** — Wyloguj → zaloguj jako urząd (`meow` / `meow_meow`) → `/admin`: heatmapa, kolejka „Gotowe”, zgłoszenia nadużyć (usuń / zablokuj autora).
8. **2:40** — Bonus: serduszko w nawigacji → kawaii mode (meow meow).
9. **2:50** — Zamknięcie: „Nie mapa dla mapy — pętla od mieszkańca do urzędu.”

## Pytania jury

- Dane: Flask + SQLite (surowy SQL, seed), zgłoszenia wygasają po 7 dniach — docelowo Biblioteka Innowacji / Open Data.
- Matchmaking: lokalne embeddingi (bez klucza API), podmienialne na model językowy.
- Auth: konta z hasłem, jeden głos na konto, rola urzędu; produkcja = SSO urzędu / Profil Zaufany.
- Zdjęcia: do 4 na post, zmniejszane w przeglądarce, bajty w SQLite; produkcja = object storage.
- Moderacja: JEV (model przez OpenRouter) sprawdza posty ze zdjęciami, komentarze i nazwy kont; do tego zgłoszenia nadużyć i bany w panelu urzędu.
- Prywatność: treści do moderacji trafiają do OpenRoutera; produkcja = model hostowany w UE / umowa powierzenia.
- Brak sieci: moderacja przepuszcza treść i zapisuje to w logu, żeby aplikacja działała dalej.
