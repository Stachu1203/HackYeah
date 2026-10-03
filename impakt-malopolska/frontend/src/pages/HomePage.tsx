import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, Map as MapIcon } from "lucide-react";
import { IssuesMap } from "../components/IssuesMap";
import { IssueFeed } from "../components/IssueFeed";
import { AddIssueForm } from "../components/AddIssueForm";
import { useIssues } from "../lib/issues-context";
import { UPVOTE_THRESHOLD } from "../lib/types";
import { useTheme } from "../lib/theme";

type Tab = "feed" | "map";

export function HomePage() {
  const { issues, ready, error, toggleVote } = useIssues();
  const { kawaii } = useTheme();
  const [tab, setTab] = useState<Tab>("feed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string, ms = 2500) {
    setToast(message);
    setTimeout(() => setToast(null), ms);
  }

  async function handleToggleVote(id: string) {
    const before = issues.find((i) => i.id === id);
    try {
      const updated = await toggleVote(id);
      if (before && before.upvotes < UPVOTE_THRESHOLD && updated.upvotes >= UPVOTE_THRESHOLD) {
        showToast("Próg poparcia osiągnięty — można generować wniosek!", 3200);
      } else if (before?.voted && !updated.voted) {
        showToast("Cofnięto poparcie");
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Nie udało się zagłosować");
    }
  }

  const totalVotes = issues.reduce((sum, i) => sum + i.upvotes, 0);

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-4 pt-6 sm:pt-7">
        <p className="mb-2 inline-block -rotate-2 rounded-md border-2 border-[var(--ink)] bg-[var(--riso-yellow)] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.18em]">
          <span className="hidden sm:inline">Tablica sąsiedzka · </span>
          {issues.length} kartek · {totalVotes} głosów
        </p>
        <h1 className="font-display text-[40px] font-black italic sm:text-[46px] leading-[0.95] tracking-tight text-[var(--ink)]">
          <span className="squiggle">Sąsiedzi</span>
          <span className="text-[var(--riso-red)]">{kawaii ? " ♡" : "."}</span>
        </h1>
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
      </div>

      <div className="mx-auto mt-6 w-full max-w-lg flex-1 px-4">
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
            Przypinamy kartki…
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
              {ready && <IssueFeed issues={issues} onToggleVote={handleToggleVote} />}
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
                  issues={issues}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  className="h-full min-h-[420px]"
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
          showToast("Przypięte do tablicy!");
        }}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full border-2 border-[var(--ink)] bg-[var(--riso-yellow)] px-5 py-2.5 text-[14px] font-bold text-[var(--ink)] shadow-[3px_3px_0_var(--shadow)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
