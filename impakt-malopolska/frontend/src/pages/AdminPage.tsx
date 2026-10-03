import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useRole } from "../lib/role-context";
import { CATEGORY_LABELS, UPVOTE_THRESHOLD } from "../lib/types";
import { categoryPlaceholder } from "../lib/placeholders";

export function AdminPage() {
  const { issues, reset, markSent } = useIssues();
  const { isAdmin, setRole } = useRole();
  const navigate = useNavigate();
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

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--wash)]">
          <Lock className="h-6 w-6 text-[var(--muted)]" />
        </span>
        <h1 className="text-[22px] font-bold tracking-tight">Panel urzędu</h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          Demo: przełącz się na rolę „Urząd”, żeby zobaczyć heatmapę i kolejkę
          wniosków.
        </p>
        <button
          type="button"
          onClick={() => setRole("admin")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 text-[16px] font-semibold text-white"
        >
          <Shield className="h-4 w-4" />
          Wejdź jako urząd
        </button>
        <Link to="/" className="mt-4 text-[15px] font-semibold text-[var(--accent)]">
          Wróć do tablicy
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-bold tracking-tight">
            <Flame className="h-7 w-7 text-[#ff9500]" />
            Panel urzędu
          </h1>
          <p className="mt-1 max-w-xl text-[15px] text-[var(--muted)]">
            Heatmapa potrzeb + kolejka zgłoszeń gotowych do wniosku. Zgłoszenia wygasają po 7 dniach.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setRole("user");
              navigate("/");
            }}
            className="rounded-full bg-[var(--wash)] px-3 py-2 text-[13px] font-semibold"
          >
            Jako mieszkaniec
          </button>
          <button
            type="button"
            onClick={() => void reset()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--wash)] px-3 py-2 text-[13px] font-semibold text-[var(--muted)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Głosy", value: totalVotes },
          { label: "Do wniosku", value: readyCount },
          { label: "Wysłane", value: sentCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-[var(--surface)] p-3 shadow-sm sm:p-4"
          >
            <p className="text-[12px] text-[var(--muted)]">{stat.label}</p>
            <p className="text-[24px] font-bold tracking-tight sm:text-[28px]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-[var(--wash)] p-1">
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
            className={`shrink-0 rounded-[10px] px-3 py-2 text-[13px] font-semibold ${
              filter === id
                ? "bg-[var(--surface)] shadow-sm"
                : "text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="h-[420px] overflow-hidden rounded-[22px] bg-[var(--surface)] shadow-sm lg:h-[520px]">
          <IssuesMap
            issues={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            heatMode
            className="h-full min-h-[420px]"
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-[22px] bg-[var(--surface)] p-4 shadow-sm">
            <h2 className="text-[16px] font-bold">Gorące obszary</h2>
            <ul className="mt-3 space-y-2.5">
              {byArea.slice(0, 6).map(([area, votes], index) => (
                <li key={area} className="text-[14px]">
                  <div className="mb-1 flex justify-between gap-2">
                    <span className="font-medium">
                      {index + 1}. {area}
                    </span>
                    <span className="text-[var(--muted)]">{votes}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--wash)]">
                    <motion.div
                      className="h-full rounded-full bg-[#ff9500]"
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

          <div className="rounded-[22px] bg-[var(--surface)] p-4 shadow-sm">
            <h2 className="text-[16px] font-bold">Kolejka</h2>
            <ul className="mt-3 max-h-[320px] space-y-2 overflow-y-auto">
              {hot.map((issue) => {
                const src =
                  issue.imageUrl ||
                  categoryPlaceholder(issue.category, issue.title);
                return (
                  <li key={issue.id}>
                    <div className="flex gap-3 rounded-xl p-2 hover:bg-[var(--wash)]">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 gap-3 text-left"
                        onClick={() => setSelectedId(issue.id)}
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                        <span className="min-w-0">
                          <span className="line-clamp-1 text-[14px] font-semibold">
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
                            className="shrink-0 self-center rounded-full p-2 text-[var(--accent)]"
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
