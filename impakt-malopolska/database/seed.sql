-- ImpaktMałopolska — dane startowe (Kraków + gminy Małopolski)
-- Daty zgłoszeń są względne, żeby seed nie wpadał od razu pod usuwanie zgłoszeń starszych niż tydzień.
-- Embeddingi (NULL) backend przelicza przy starcie.

INSERT INTO issues (id, title, description, category, latitude, longitude, location_name,
                    upvotes, status, author_name, created_at, keywords) VALUES
('iss-01', 'Brak oświetlenia przy przystanku',
 'Przy przystanku przy ul. Lubicz wieczorem jest ciemno. Seniorzy i uczniowie czują się niebezpiecznie.',
 'SAFETY', 50.0647, 19.945, 'Kraków — Śródmieście', 34, 'READY_TO_SEND', 'Anna K.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-3 days', '-2 hours'),
 '["oświetlenie", "przystanek", "bezpieczeństwo", "ciemno"]'),

('iss-02', 'Wysoki krawężnik przy wejściu do przychodni',
 'Wejście do przychodni na Nowej Hucie ma wysoki próg — wózek i osoby z laską nie wejdą samodzielnie.',
 'ACCESSIBILITY', 50.0722, 20.0374, 'Kraków — Nowa Huta', 28, 'READY_TO_SEND', 'Marek W.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-4 days', '-5 hours'),
 '["krawężnik", "wózek", "przychodnia", "dostępność", "rampa"]'),

('iss-03', 'Brak kółka programistycznego dla młodzieży',
 'W Limanowej nie ma bezpłatnych zajęć z programowania. Młodzież dojeżdża do Nowego Sącza.',
 'EDUCATION', 49.7061, 20.4228, 'Limanowa', 19, 'DRAFT', 'Ola N.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 days', '-3 hours'),
 '["programowanie", "młodzież", "zajęcia", "edukacja", "kółko"]'),

('iss-04', 'Samotność seniorów w bloku',
 'W bloku przy al. Pokoju wielu seniorów nie wychodzi tygodniami. Brakuje sąsiedzkiego wsparcia.',
 'SENIORS', 50.0755, 19.9682, 'Kraków — Prądnik Czerwony', 41, 'SENT', 'Piotr S.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-6 days', '-4 hours'),
 '["seniorzy", "samotność", "sąsiedzi", "wsparcie", "wizyty"]'),

('iss-05', 'Dziura w chodniku na trasie do szkoły',
 'Przy szkole podstawowej w Skawinie chodnik ma głęboką dziurę — dzieci omijają ją jezdnią.',
 'INFRASTRUCTURE', 49.9753, 19.8274, 'Skawina', 52, 'READY_TO_SEND', 'Ewa L.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-5 days', '-6 hours'),
 '["chodnik", "dziura", "szkoła", "droga", "naprawa"]'),

('iss-06', 'Brak miejsc odpoczynku na deptaku',
 'Na Rynku w Tarnowie brakuje ławek w cieniu. Seniorzy i rodzice z wózkami nie mają gdzie odpocząć.',
 'SENIORS', 50.0121, 20.9858, 'Tarnów', 23, 'DRAFT', 'Tomek B.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-2 days', '-1 hours'),
 '["ławki", "odpoczynek", "seniorzy", "deptak", "cień"]'),

('iss-07', 'Słaby zasięg transportu wieczorem',
 'Ostatni autobus z Zabierzowa do Krakowa odjeżdża zbyt wcześnie — pracownicy wracają taksówką.',
 'INFRASTRUCTURE', 50.1167, 19.8, 'Zabierzów', 37, 'READY_TO_SEND', 'Zofia M.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-4 days', '-9 hours'),
 '["autobus", "transport", "wieczór", "dojazd", "rozkład"]'),

('iss-08', 'Brak grupy wsparcia zdrowia psychicznego',
 'Młodzi mieszkańcy Nowego Sącza czekają miesiącami na psychologa. Brakuje lokalnej grupy rówieśniczej.',
 'HEALTH', 49.6219, 20.6972, 'Nowy Sącz', 31, 'DRAFT', 'Jan D.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-3 days', '-7 hours'),
 '["zdrowie psychiczne", "młodzież", "wsparcie", "grupa", "psycholog"]'),

('iss-09', 'Nieczytelne oznakowanie dla osób niewidomych',
 'Przy urzędzie w Olkuszu brak ścieżek naprowadzających i kontrastowych oznaczeń schodów.',
 'ACCESSIBILITY', 50.2794, 19.565, 'Olkusz', 18, 'DRAFT', 'Kasia R.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-20 hours'),
 '["niewidomi", "oznakowanie", "kontrast", "ścieżka", "dostępność"]'),

('iss-10', 'Pusty lokal mógłby być klubem sąsiedzkim',
 'Parterowy lokal przy ul. Dietla stoi pusty. Sąsiedzi chcą klubu z kawą i warsztatami.',
 'COMMUNITY', 50.056, 19.9445, 'Kraków — Kazimierz', 45, 'READY_TO_SEND', 'Adam P.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-6 days', '-10 hours'),
 '["klub sąsiedzki", "lokal", "warsztaty", "społeczność", "kawiarnia"]'),

('iss-11', 'Brak opieki wytchnieniowej dla opiekunów',
 'Opiekunowie osób zależnych w Wadowicach nie mają gdzie zostawić bliskich na kilka godzin.',
 'SENIORS', 49.8833, 19.4925, 'Wadowice', 26, 'DRAFT', 'Magda H.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-2 days', '-8 hours'),
 '["opieka wytchnieniowa", "opiekunowie", "seniorzy", "dzień", "wsparcie"]'),

('iss-12', 'Zalewany parking rowerowy przy dworcu',
 'Przy dworcu w Chrzanowie stojaki rowerowe są pod wodą po deszczu — rowery rdzewieją.',
 'INFRASTRUCTURE', 50.1355, 19.402, 'Chrzanów', 15, 'DRAFT', 'Bartek C.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-5 hours'),
 '["rower", "parking", "dworzec", "deszcz", "infrastruktura"]');

INSERT INTO innovations (id, title, source_municipality, description, category, keywords, grant_hint) VALUES
('inn-01', 'Sąsiedzka Latarnia — mikrogranty na oświetlenie', 'Skawina',
 'Mieszkańcy zgłaszają ciemne punkty; gmina finansuje lampy solarne z mikrograntu sąsiedzkiego.',
 'SAFETY', '["oświetlenie", "lampa", "bezpieczeństwo", "mikrogrant", "przystanek"]',
 'Mikrogrant sąsiedzki / budżet obywatelski'),

('inn-02', 'Rampa w 48h — mobilny warsztat dostępności', 'Zabierzów',
 'Wolontariusze + urząd montują tymczasową rampę i zgłaszają trwałą przebudowę do planu inwestycji.',
 'ACCESSIBILITY', '["rampa", "krawężnik", "wózek", "dostępność", "przychodnia"]',
 'Fundusz dostępności / PFRON'),

('inn-03', 'Kod od sąsiada — kółka IT w bibliotekach', 'Nowy Targ',
 'Biblioteka udostępnia salę; lokalni programiści prowadzą bezpłatne kółka dla młodzieży.',
 'EDUCATION', '["programowanie", "kółko", "młodzież", "biblioteka", "edukacja"]',
 'Grant edukacyjny ROPS / FIO'),

('inn-04', 'Telefon do sąsiada — wizyty sąsiedzkie', 'Wieliczka',
 'Koordynator łączy wolontariuszy z samotnymi seniorami na cotygodniowe wizyty i zakupy.',
 'SENIORS', '["seniorzy", "samotność", "wizyty", "wolontariat", "sąsiedzi"]',
 'Program senioralny województwa'),

('inn-05', 'Łataj z nami — patrol chodnikowy', 'Niepołomice',
 'Aplikacja zgłoszeń + szybka ekipa remontowa gminy w ciągu 10 dni roboczych.',
 'INFRASTRUCTURE', '["chodnik", "dziura", "naprawa", "droga", "szkoła"]',
 'Budżet utrzymania dróg gminy'),

('inn-06', 'Ławka z cieniem — meble miejskie od mieszkańców', 'Bochnia',
 'Projekt partycypacyjny: mieszkańcy wybierają lokalizacje ławek i sadzą drzewa.',
 'SENIORS', '["ławki", "cień", "odpoczynek", "deptak", "seniorzy"]',
 'Budżet obywatelski'),

('inn-07', 'Nocny bus pop-up — test linii wieczornych', 'Krzeszowice',
 '3-miesięczny pilot dodatkowych kursów wieczornych na podstawie mapy popytu mieszkańców.',
 'INFRASTRUCTURE', '["autobus", "transport", "wieczór", "rozkład", "dojazd"]',
 'Fundusz transportu publicznego'),

('inn-08', 'Krąg rozmowy — grupy rówieśnicze zdrowia psychicznego', 'Myślenice',
 'Facylitowane spotkania młodzieży w CUS, bez diagnozy, z możliwością skierowania do specjalisty.',
 'HEALTH', '["zdrowie psychiczne", "grupa", "młodzież", "wsparcie", "CUS"]',
 'Program zdrowia psychicznego'),

('inn-09', 'Lokal na godzinę — klub sąsiedzki pop-up', 'Kraków (Krowodrza)',
 'Gmina udostępnia pusty lokal na popołudnia; mieszkańcy prowadzą kawę i warsztaty.',
 'COMMUNITY', '["klub sąsiedzki", "lokal", "warsztaty", "społeczność", "kawiarnia"]',
 'Program rewitalizacji / CUS'),

('inn-10', 'Oddech dla opiekuna — opieka wytchnieniowa 4h', 'Oświęcim',
 'Dyżury opiekunów zastępczych w ośrodku dziennym — 4 godziny wytchnienia tygodniowo.',
 'SENIORS', '["opieka wytchnieniowa", "opiekunowie", "dzień", "seniorzy", "wsparcie"]',
 'Usługa społeczna CUS / ROPS');

INSERT INTO comments (id, issue_id, author_name, body, created_at) VALUES
('cmt-01', 'iss-01', 'Marek W.', 'Potwierdzam — wracam tamtędy po 21 i lampa nie działa od miesiąca.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-2 days', '-6 hours')),
('cmt-02', 'iss-01', 'Zofia M.', 'Zgłaszałam to w ZDMK, ale bez odpowiedzi. Może wniosek z podpisami zadziała.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 days', '-2 hours')),
('cmt-03', 'iss-05', 'Anna K.', 'Moje dziecko też chodzi tą trasą. Dziura jest coraz większa po deszczach.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-4 days')),
('cmt-04', 'iss-10', 'Kasia R.', 'Chętnie poprowadzę tam warsztaty z szycia dla sąsiadów!',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-5 days', '-3 hours')),
('cmt-05', 'iss-02', 'Piotr S.', 'Moja mama na wózku musi czekać, aż ktoś pomoże. Rampa naprawdę potrzebna.',
 strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-3 days', '-1 hours'));
