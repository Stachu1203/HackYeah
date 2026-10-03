import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MapPin, ChevronRight } from "lucide-react";
import type { Issue } from "../lib/types";
import { CATEGORY_LABELS, UPVOTE_THRESHOLD } from "../lib/types";
import { CATEGORY_ICONS } from "../lib/category-ui";
import { categoryPlaceholder } from "../lib/placeholders";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "przed chwilą";
  if (h < 24) return `${h} godz. temu`;
  const d = Math.floor(h / 24);
  return `${d} dni temu`;
}

type Props = {
  issues: Issue[];
  onUpvote: (id: string) => void;
  pulseId?: string | null;
};

export function IssueFeed({ issues, onUpvote, pulseId }: Props) {
  const sorted = [...issues].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ul className="mx-auto flex w-full max-w-lg flex-col gap-5 pb-28">
      {sorted.map((issue, index) => {
        const Icon = CATEGORY_ICONS[issue.category];
        const src =
          issue.imageUrl || categoryPlaceholder(issue.category, issue.title);
        const ready = issue.upvotes >= UPVOTE_THRESHOLD;

        return (
          <motion.li
            key={issue.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.24) }}
            className="overflow-hidden rounded-[22px] bg-[var(--surface)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--wash)] text-[var(--ink)]">
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-[var(--ink)]">
                  {issue.authorName}
                </p>
                <p className="flex items-center gap-1 truncate text-[12px] text-[var(--muted)]">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  {issue.locationName} · {timeAgo(issue.createdAt)}
                </p>
              </div>
              <span className="rounded-full bg-[var(--wash)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
                {CATEGORY_LABELS[issue.category]}
              </span>
            </div>

            <Link to={`/zgloszenie/${issue.id}`} className="block">
              <img
                src={src}
                alt=""
                className="aspect-[4/3] w-full object-cover bg-[var(--wash)]"
              />
            </Link>

            <div className="space-y-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/zgloszenie/${issue.id}`} className="min-w-0">
                  <h2 className="text-[17px] font-semibold leading-snug tracking-tight text-[var(--ink)]">
                    {issue.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[15px] leading-relaxed text-[var(--muted)]">
                    {issue.description}
                  </p>
                </Link>
              </div>

              {ready && (
                <p className="text-[12px] font-semibold text-[var(--accent)]">
                  Gotowe do wniosku urzędowego
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <motion.button
                  type="button"
                  onClick={() => onUpvote(issue.id)}
                  animate={
                    pulseId === issue.id ? { scale: [1, 1.12, 1] } : { scale: 1 }
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--wash)] px-3.5 py-2 text-[15px] font-semibold text-[var(--ink)] transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  aria-label={`Poprzyj: ${issue.title}`}
                >
                  <Heart
                    className="h-4 w-4 text-[#ff3b30]"
                    fill={issue.upvotes > 1 ? "#ff3b30" : "transparent"}
                    aria-hidden
                  />
                  {issue.upvotes}
                </motion.button>
                <Link
                  to={`/zgloszenie/${issue.id}`}
                  className="inline-flex items-center gap-1 text-[15px] font-semibold text-[var(--accent)]"
                >
                  Szczegóły
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
