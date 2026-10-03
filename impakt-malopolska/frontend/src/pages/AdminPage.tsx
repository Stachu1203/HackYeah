import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Flame,
  Lock,
  RotateCcw,
  Shield,
} from "lucide-react";
import { IssuesMap } from "../components/IssuesMap";
import { useIssues } from "../lib/issues-context";
import { useAuth } from "../lib/auth-context";
import { CATEGORY_LABELS, UPVOTE_THRESHOLD } from "../lib/types";
import { categoryPlaceholder } from "../lib/placeholders";

const BAR_COLORS = ["var(--riso-red)", "var(--riso-yellow)", "var(--riso-blue)", "var(--riso-pink)", "var(--riso-mint)", "var(--riso-teal)"];

export function AdminPage() {
  const { issues, reset, markSent } = useIssues();
  const { user, ready: authReady, isAdmin } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "READY" | "SENT" | "DRAFT">(
    "ALL",
  );

  const filtered = useMemo(() => {
    return issues.filter((i) => {
      if (filter === "READY") return i.upvotes >= UPVOTE_THRESHOLD && i.status !== "SENT";
      if (filter === "SENT") return i.status === "SENT";
      if (filter === "DRAFT") return i.status === "DRAFT" && i.upvotes < UPVOTE_THRESHOLD;
      return true;
    });
  }, [issues, filter]);

  const hot = useMemo(
    () => [...filtered].sort((a, b) => b.upvotes - a.upvotes),
    [filtered],
  );

  const readyCount = issues.filter(
    (i) => i.upvotes >= UPVOTE_THRESHOLD && i.status !== "SENT",
  ).length;
  const sentCount = issues.filter((i) => i.status === "SENT").length;
  const totalVotes = issues.reduce((s, i) => s + i.upvotes, 0);

  const byArea = useMemo(() => {
    const map = new Map<string, number>();
    for (const issue of issues) {
      const area =
        issue.locationName.split("—")[0]?.trim() ?? issue.locationName;
      map.set(area, (map.get(area) ?? 0) + issue.upvotes);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [issues]);

  if (!authReady) {
    return (
      <p role="status" className="py-16 text-center font-display text-[18px] italic text-[var(--muted)]">
        Sprawdzamy przepustkę…
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-5 flex h-16 w-16 -rotate-6 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--riso-yellow)] shadow-[3px_3px_0_var(--ink)]">
          <Lock className="h-7 w-7 text-[var(--ink)]" aria-hidden />
        </span>
        <h1 className="font-display text-[34px] font-black italic tracking-tight">Panel urzędu</h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          {user
            ? `Konto „${user.username}” nie ma uprawnień urzędu.`
            : "Heatmapa i kolejka wniosków są dostępne po zalogowaniu na konto urzędu."}
        </p>
        {!user && (
          <Link
            to="/logowanie"
            state={{ from: "/admin" }}
            className="ink-btn mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--riso-blue)] px-5 py-3 text-[16px] font-bold text-[var(--surface)]"
          >
            <Shield className="h-4 w-4" aria-hidden />
            Zaloguj jako urząd
          </Link>
        )}
        <Link to="/" className="mt-5 text-[15px] font-bold text-[var(--accent)] underline decoration-2 underline-offset-4">
          Wróć do tablicy
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-7 sm:px-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 inline-block -rotate-2 rounded-md border-2 border-[var(--ink)] bg-[var(--riso-blue)] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--surface)]">
            Widok instytucji
          </p>
          <h1 className="flex items-center gap-2 font-display text-[42px] font-black italic leading-none tracking-tight">
            <Flame className="h-9 w-9 text-[var(--riso-red)]" fill="var(--riso-yellow)" aria-hidden />
            <span className="squiggle">Panel urzędu</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-[var(--ink)]/75">
            Heatmapa potrzeb + kolejka zgłoszeń gotowych do wniosku. Zgłoszenia wygasają po 7 dniach.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/"
            className="ink-btn rounded-full bg-[var(--riso-yellow)] px-3.5 py-1.5 text-[13px] font-bold"
          >
            Tablica mieszkańców
          </Link>
          <button
            type="button"
            onClick={() => void reset()}
            className="ink-btn inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3.5 py-1.5 text-[13px] font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-3 gap-3 sm:gap-5">
        {[
          { label: "Głosy", value: totalVotes, color: "var(--riso-pink)", tilt: "-rotate-1" },
          { label: "Do wniosku", value: readyCount, color: "var(--riso-yellow)", tilt: "rotate-1" },
          { label: "Wysłane", value: sentCount, color: "#9fb2f0", tilt: "-rotate-[0.5deg]" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`paper-card p-3 sm:p-4 ${stat.tilt}`}
            style={{ background: stat.color }}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em]">{stat.label}</p>
            <p className="font-display text-[34px] font-black leading-tight tracking-tight sm:text-[46px]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] p-1">
        {(
          [
            ["ALL", "Wszystkie"],
            ["READY", "Gotowe"],
            ["DRAFT", "Nowe"],
            ["SENT", "Wysłane"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
              filter === id
                ? "bg-[var(--ink)] text-[var(--surface)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="paper-card h-[420px] overflow-hidden lg:h-[540px]">
          <IssuesMap
            issues={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            heatMode
            className="h-full min-h-[420px]"
          />
        </div>

        <div className="space-y-6">
          <div className="paper-card p-4">
            <span className="tape" aria-hidden />
            <h2 className="font-display text-[22px] font-black italic">Gorące obszary</h2>
            <ul className="mt-3 space-y-2.5">
              {byArea.slice(0, 6).map(([area, votes], index) => (
                <li key={area} className="text-[14px]">
                  <div className="mb-1 flex justify-between gap-2">
                    <span className="font-semibold">
                      {index + 1}. {area}
                    </span>
                    <span className="font-mono font-bold">{votes}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border-2 border-[var(--ink)] bg-[var(--surface)]">
                    <motion.div
                      className="h-full"
                      style={{ background: BAR_COLORS[index % BAR_COLORS.length] }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (votes / (byArea[0]?.[1] || 1)) * 100)}%`,
                      }}
                      transition={{ duration: 0.5, delay: index * 0.04 }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="paper-card p-4">
            <h2 className="font-display text-[22px] font-black italic">Kolejka</h2>
            <ul className="mt-3 max-h-[320px] space-y-2 overflow-y-auto">
              {hot.map((issue) => {
                const src =
                  issue.imageUrl ||
                  categoryPlaceholder(issue.category, issue.title);
                return (
                  <li key={issue.id}>
                    <div className="flex gap-3 rounded-xl border-2 border-transparent p-2 transition hover:border-[var(--ink)] hover:bg-[var(--wash)]">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 gap-3 text-left"
                        onClick={() => setSelectedId(issue.id)}
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border-2 border-[var(--ink)] object-cover"
                        />
                        <span className="min-w-0">
                          <span className="line-clamp-1 text-[14px] font-bold">
                            {issue.title}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-[var(--muted)]">
                            {issue.locationName} ·{" "}
                            {CATEGORY_LABELS[issue.category]} · {issue.upvotes}
                          </span>
                        </span>
                      </button>
                      {issue.status !== "SENT" &&
                        issue.upvotes >= UPVOTE_THRESHOLD && (
                          <button
                            type="button"
                            onClick={() => void markSent(issue.id)}
                            className="ink-btn shrink-0 self-center rounded-full bg-[var(--riso-mint)] p-1.5 text-[var(--surface)]"
                            aria-label="Oznacz jako wysłane"
                            title="Oznacz wysłane"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                        )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
