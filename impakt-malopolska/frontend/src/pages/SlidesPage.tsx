import { useEffect } from "react";

const slides = [
  {
    n: 1,
    title: "ImpaktMałopolska",
    body: "Hub Innowacji Społecznych\nZ głosu mieszkańców — gotowy wniosek do urzędu",
  },
  {
    n: 2,
    title: "Problem",
    body: "Oddolne inicjatywy giną. Urzędy dostają szum. Brak mostu: potrzeba ↔ innowacja ↔ formalny wniosek.",
  },
  {
    n: 3,
    title: "Rozwiązanie",
    body: "Mapa → upvote → AI matchmaking → wniosek art. 241 KPA → heatmapa instytucji",
  },
  {
    n: 4,
    title: "Użytkownicy",
    body: "Mieszkańcy i NGO · JST · ROPS Kraków · eksperci branżowi",
  },
  {
    n: 5,
    title: "Matchmaking społeczny",
    body: "Problem mieszkańca → sprawdzona innowacja z innej gminy (Biblioteka Innowacji)",
  },
  {
    n: 6,
    title: "Wniosek obywatelski",
    body: "Automatyczny draft art. 241 KPA + właściwy wydział + poparcie społeczności",
  },
  {
    n: 7,
    title: "Heatmapa / Social Twin",
    body: "Panel instytucji: gdzie w Małopolsce kumulują się niezałatwione potrzeby",
  },
  {
    n: 8,
    title: "Dostępność i UX",
    body: "Polski interfejs · duży tekst · kontrast · lista obok mapy · focus keyboard",
  },
  {
    n: 9,
    title: "Tech + Opus 5.5",
    body: "Vite + React · Flask REST API · SQLite (surowy SQL) · embeddingi do matchmakingu · Leaflet\nBudowaliśmy z Opus 5.5 jako asystentem implementacji i generatorem wniosków — walidacja i UX są nasze.",
  },
  {
    n: 10,
    title: "Wdrożenie",
    body: "MVP pod pilotaż Huba · niski koszt utrzymania · skalowanie na województwo",
  },
];

export function SlidesPage() {
  useEffect(() => {
    document.title = "Slajdy — ImpaktMałopolska";
  }, []);

  return (
    <div className="bg-stone-900 print:bg-white">
      <p className="px-4 py-3 text-center text-sm text-stone-300 print:hidden">
        Ctrl+P → Zapisz jako PDF · 10 slajdów
      </p>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-10 print:gap-0 print:p-0">
        {slides.map((slide) => (
          <section
            key={slide.n}
            className="flex min-h-[70vh] flex-col justify-center rounded-2xl border border-stone-700 bg-[#fffcf7] p-10 text-[#1c1917] shadow-lg print:min-h-[100vh] print:break-after-page print:rounded-none print:border-0 print:shadow-none"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-800">
              {slide.n} / 10 · ImpaktMałopolska
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {slide.title}
            </h1>
            <p className="mt-6 whitespace-pre-line text-xl leading-relaxed text-stone-700 sm:text-2xl">
              {slide.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
