import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  fallback: string;
  className?: string;
  /** opis do czytnika ekranu, np. tytuł zgłoszenia */
  label: string;
};

/** Zdjęcia zgłoszenia: przewijane palcem (scroll-snap), strzałki i kropki. */
export function ImageCarousel({ images, fallback, className = "", label }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const srcs = images.length ? images : [fallback];

  function go(to: number) {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(srcs.length - 1, to));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className={`group relative ${className}`} role="region" aria-roledescription="galeria" aria-label={`Zdjęcia: ${label}`}>
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {srcs.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={images.length ? `Zdjęcie ${i + 1} z ${images.length}` : ""}
            loading={i === 0 ? "eager" : "lazy"}
            className="h-full w-full shrink-0 snap-center bg-[var(--wash)] object-cover"
          />
        ))}
      </div>
      {srcs.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              go(index - 1);
            }}
            disabled={index === 0}
            aria-label="Poprzednie zdjęcie"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] p-1 disabled:opacity-0 sm:group-hover:block"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              go(index + 1);
            }}
            disabled={index === srcs.length - 1}
            aria-label="Następne zdjęcie"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] p-1 disabled:opacity-0 sm:group-hover:block"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-[var(--surface)]/85 px-2 py-1">
            {srcs.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  go(i);
                }}
                aria-label={`Zdjęcie ${i + 1}`}
                aria-current={i === index}
                className={`h-2 w-2 rounded-full border border-[var(--ink)] transition ${
                  i === index ? "bg-[var(--ink)]" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
