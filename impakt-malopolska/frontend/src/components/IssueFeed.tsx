import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowUpRight } from "lucide-react";
import type { Issue } from "../lib/types";
import { CATEGORY_LABELS, UPVOTE_THRESHOLD } from "../lib/types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../lib/category-ui";
import { categoryPlaceholder } from "../lib/placeholders";
import { VoteButton } from "./VoteButton";

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "przed chwilą";
  if (h < 24) return `${h} godz. temu`;
  const d = Math.floor(h / 24);
  return d === 1 ? "wczoraj" : `${d} dni temu`;
}

/** Ile dni zostało do automatycznego usunięcia (7 dni od dodania). */
function daysLeft(iso: string) {
  const left = 7 - (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return Math.max(0, Math.ceil(left));
}

const TILTS = ["-rotate-[0.8deg]", "rotate-[0.6deg]", "-rotate-[0.3deg]", "rotate-[1deg]"];

type Props = {
  issues: Issue[];
  onToggleVote: (id: string) => Promise<unknown>;
};

export function IssueFeed({ issues, onToggleVote }: Props) {
  const sorted = [...issues].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className="paper-card mx-auto max-w-lg p-8 text-center">
        <p className="font-display text-[24px] font-bold italic">Pusta tablica</p>
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          Zgłoszenia wygasają po tygodniu. Przypnij pierwsze — przycisk na dole.
        </p>
      </div>
    );
  }

  return (
    <ul className="mx-auto flex w-full max-w-lg flex-col gap-9 pb-32 pt-3">
      {sorted.map((issue, index) => {
        const Icon = CATEGORY_ICONS[issue.category];
        const colors = CATEGORY_COLORS[issue.category];
        const src =
          issue.imageUrl || categoryPlaceholder(issue.category, issue.title);
        const ready = issue.upvotes >= UPVOTE_THRESHOLD && issue.status !== "SENT";
        const left = daysLeft(issue.createdAt);

        return (
          <motion.li
            key={issue.id}
            initial={{ opacity: 0, y: 24, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.3), type: "spring", damping: 18 }}
          >
            <article
              className={`paper-card transition-transform duration-300 hover:rotate-0 ${TILTS[index % TILTS.length]}`}
            >
              <span className="tape" aria-hidden />

              <header className="flex items-center gap-3 px-4 pb-3 pt-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)]"
                  style={{ background: colors.bg, color: colors.fg }}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-[var(--ink)]">
                    {issue.authorName}
                  </p>
                  <p className="flex items-center gap-1 truncate text-[12px] font-medium text-[var(--muted)]">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    {issue.locationName} · {timeAgo(issue.createdAt)}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full border-2 border-[var(--ink)] px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: colors.bg }}
                >
                  {CATEGORY_LABELS[issue.category]}
                </span>
              </header>

              <Link
                to={`/zgloszenie/${issue.id}`}
                className="relative mx-4 block overflow-hidden rounded-xl border-2 border-[var(--ink)]"
              >
                <img
                  src={src}
                  alt=""
                  className="aspect-[4/3] w-full bg-[var(--wash)] object-cover"
                />
                {ready && (
                  <span className="stamp absolute right-3 top-3 text-[var(--riso-red)]">
                    Gotowe do wniosku
                  </span>
                )}
                {issue.status === "SENT" && (
                  <span className="stamp absolute right-3 top-3 text-[var(--riso-blue)]">
                    Wysłano do urzędu
                  </span>
                )}
              </Link>

              <div className="space-y-2 px-4 pb-4 pt-3">
                <Link to={`/zgloszenie/${issue.id}`} className="group block">
                  <h2 className="font-display text-[23px] font-bold leading-[1.15] tracking-tight text-[var(--ink)] decoration-[var(--riso-red)] decoration-2 underline-offset-4 group-hover:underline">
                    {issue.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-[var(--muted)]">
                    {issue.description}
                  </p>
                </Link>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <VoteButton issue={issue} onToggle={onToggleVote} />
                  <div className="flex items-center gap-3">
                    <span
                      className="hidden text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] sm:inline"
                      title="Zgłoszenia znikają z tablicy po 7 dniach"
                    >
                      {left === 0 ? "wygasa dziś" : `jeszcze ${left} dni`}
                    </span>
                    <Link
                      to={`/zgloszenie/${issue.id}`}
                      className="inline-flex items-center gap-0.5 text-[15px] font-bold text-[var(--accent)] underline decoration-2 underline-offset-4"
                    >
                      Szczegóły
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </motion.li>
        );
      })}
    </ul>
  );
}
