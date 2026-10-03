import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Flame, List, LocateFixed, Map as MapIcon, Navigation } from "lucide-react";
import { IssuesMap } from "../components/IssuesMap";
import { IssueFeed } from "../components/IssueFeed";
import { AddIssueForm } from "../components/AddIssueForm";
import { useAuth } from "../lib/auth-context";
import { useIssues } from "../lib/issues-context";
import { currentPosition, distanceKm, townOf } from "../lib/geo";
import { useKawaiiText } from "../lib/kawaii";
import { UPVOTE_THRESHOLD, type Place, type Vote } from "../lib/types";
import { useTheme } from "../lib/theme";

type Tab = "feed" | "map";
type Sort = "new" | "top" | "near";
/** "all", "near:<km>" albo "town:<nazwa>" */
type Area = string;

const RADII = [5, 10, 25, 50];
const DEFAULT_RADIUS = 25;

export function HomePage() {
  const { issues, ready, error, vote } = useIssues();
  const { user } = useAuth();
  const { kawaii } = useTheme();
  const k = useKawaiiText();
  const [tab, setTab] = useState<Tab>("feed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("new");
  const [area, setArea] = useState<Area>("all");
  const [areaTouched, setAreaTouched] = useState(false);
  // Bieżąca pozycja z przeglądarki — na mapie i jako punkt odniesienia bez lokalizacji w koncie.
  const [here, setHere] = useState<Place | null>(null);
  const [locating, setLocating] = useState(false);

  const home = user?.location ?? null;
  const origin = home ?? here;

  // Domyślnie tablica pokazuje okolicę z konta — dopóki ktoś sam nie zmieni filtra.
  useEffect(() => {
    if (!areaTouched) setArea(home ? `near:${DEFAULT_RADIUS}` : "all");
  }, [home, areaTouched]);

  function showToast(message: string, ms = 2500) {
    setToast(message);
    setTimeout(() => setToast(null), ms);
  }

  async function locateMe() {
    setLocating(true);
    try {
      const place = await currentPosition();
      setHere(place);
      return place;
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Nie udało się pobrać lokalizacji", 3500);
      return null;
    } finally {
      setLocating(false);
    }
  }

  async function handleVote(id: string, value: Vote) {
    const before = issues.find((i) => i.id === id);
    try {
      const updated = await vote(id, value);
      if (before && before.score < UPVOTE_THRESHOLD && updated.score >= UPVOTE_THRESHOLD) {
        showToast(k("Próg poparcia osiągnięty — można generować wniosek!", "Próg osiągnięty! やったー ♡"), 3200);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Nie udało się zagłosować");
    }
  }

  const towns = useMemo(
    () => [...new Set(issues.map(townOf))].sort((a, b) => a.localeCompare(b, "pl")),
    [issues],
  );

  const visible = useMemo(() => {
    let list = issues;
    if (area.startsWith("near:") && origin) {
      const radius = Number(area.slice(5));
      list = list.filter((i) => distanceKm(origin, i) <= radius);
    } else if (area.startsWith("town:")) {
      const town = area.slice(5);
      list = list.filter((i) => townOf(i) === town);
    }
    const byDate = (a: (typeof list)[number], b: (typeof list)[number]) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return [...list].sort((a, b) => {
      if (sort === "top") return b.score - a.score || byDate(a, b);
      if (sort === "near" && origin) return distanceKm(origin, a) - distanceKm(origin, b);
      return byDate(a, b);
    });
  }, [issues, area, origin, sort]);

  const totalVotes = issues.reduce((sum, i) => sum + i.upvotes, 0);
  const areaLabel = area.startsWith("near:")
    ? `w promieniu ${area.slice(5)} km od: ${origin?.name ?? "…"}`
    : area.startsWith("town:")
      ? area.slice(5)
      : "cała Małopolska";

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-4 pt-6 sm:pt-7">
        <p className="mb-2 inline-block -rotate-2 rounded-md border-2 border-[var(--ink)] bg-[var(--riso-yellow)] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.18em]">
          <span className="hidden sm:inline">{k("Tablica sąsiedzka · ", "ご近所ボード · ")}</span>
          {issues.length} kartek · {totalVotes} głosów
        </p>
        <h1 className="font-display text-[40px] font-black italic leading-[0.95] tracking-tight text-[var(--ink)] sm:text-[46px]">
          <span className="squiggle">Sąsiedzi</span>
          <span className="text-[var(--riso-red)]">{kawaii ? " ♡" : "."}</span>
        </h1>
        {kawaii && (
          <p className="mt-3 text-[13px] font-semibold text-[var(--muted)]" lang="ja">
            ご近所さん · gokinjo-san ✧
          </p>
        )}
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[var(--ink)]/80">
          Problemy z okolicy. <span className="marker font-semibold">Poprzyj</span>,
          dopasuj sprawdzone rozwiązanie z innej gminy i wyślij wniosek do urzędu.
        </p>

        <div
          className="mt-6 grid grid-cols-2 gap-1 rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] p-1"
          role="tablist"
          aria-label="Widok"
        >
          {(
            [
              { id: "feed", label: "Tablica", icon: List },
              { id: "map", label: "Mapa", icon: MapIcon },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-[15px] font-bold transition ${
                  active
                    ? "bg-[var(--ink)] text-[var(--surface)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        {/* Filtry: gdzie + kolejność */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <label htmlFor="area" className="sr-only">
              Pokaż zgłoszenia z
            </label>
            <select
              id="area"
              value={area}
              onChange={(e) => {
                setAreaTouched(true);
                setArea(e.target.value);
              }}
              className="min-w-0 flex-1 truncate rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] px-3.5 py-2 text-[14px] font-bold outline-none"
            >
              <option value="all">📍 Cała Małopolska</option>
              {origin && (
                <optgroup label={`W pobliżu: ${origin.name}`}>
                  {RADII.map((r) => (
                    <option key={r} value={`near:${r}`}>
                      ◎ do {r} km od: {origin.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Miejscowość">
                {towns.map((t) => (
                  <option key={t} value={`town:${t}`}>
                    {t}
                  </option>
                ))}
              </optgroup>
            </select>
            {!home && (
              <button
                type="button"
                onClick={async () => {
                  const place = await locateMe();
                  if (place) {
                    setAreaTouched(true);
                    setArea(`near:${DEFAULT_RADIUS}`);
                  }
                }}
                disabled={locating}
                className="ink-btn inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1.5 text-[13px] font-bold disabled:opacity-60"
                title="Pokaż zgłoszenia w pobliżu mojej obecnej lokalizacji"
              >
                <LocateFixed className="h-4 w-4" aria-hidden />
                <span className="hidden min-[400px]:inline">{locating ? "Szukam…" : "W pobliżu"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1" role="radiogroup" aria-label="Kolejność">
            {(
              [
                { id: "new", label: "Najnowsze", icon: Clock },
                { id: "top", label: "Najlepsze", icon: Flame },
                { id: "near", label: "Najbliżej", icon: Navigation },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const disabled = id === "near" && !origin;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={sort === id}
                  disabled={disabled}
                  title={disabled ? "Ustaw lokalizację w koncie albo kliknij „W pobliżu”" : undefined}
                  onClick={() => setSort(id)}
                  className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-[13px] font-bold transition disabled:opacity-40 ${
                    sort === id
                      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
                      : "border-transparent text-[var(--muted)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] font-semibold text-[var(--muted)]" aria-live="polite">
            {visible.length} z {issues.length} · {areaLabel}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-5 w-full max-w-lg flex-1 px-4">
        {error && (
          <p
            role="alert"
            className="paper-card mb-6 bg-[#fbd3c9] px-4 py-3 text-[14px] font-semibold"
          >
            {error} — czy backend działa na porcie 5001?
          </p>
        )}
        {!ready && (
          <p role="status" className="py-10 text-center font-display text-[18px] italic text-[var(--muted)]">
            {k("Przypinamy kartki…", "Chotto matte… ちょっと待って")}
          </p>
        )}
        <AnimatePresence mode="wait">
          {tab === "feed" ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              {ready && (
                <IssueFeed
                  issues={visible}
                  onVote={handleVote}
                  origin={origin}
                  emptyHint={
                    issues.length
                      ? "Nic w tym obszarze — zmień filtr albo przypnij pierwsze zgłoszenie."
                      : undefined
                  }
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="pb-28"
            >
              <div className="paper-card h-[min(70vh,560px)] overflow-hidden">
                <IssuesMap
                  issues={visible}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  home={home}
                  here={here}
                  onLocate={() => void locateMe()}
                  locating={locating}
                  className="h-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddIssueForm
        fab
        onCreated={(id) => {
          setSelectedId(id);
          setTab("feed");
          setSort("new");
          showToast(k("Przypięte do tablicy!", "Przypięte! ありがとう ♡"));
        }}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 z-[70] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full border-2 border-[var(--ink)] bg-[var(--riso-yellow)] px-5 py-2.5 text-center text-[14px] font-bold text-[var(--ink)] shadow-[3px_3px_0_var(--shadow)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
