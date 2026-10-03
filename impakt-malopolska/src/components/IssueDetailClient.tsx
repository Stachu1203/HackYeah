"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Heart,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import { useIssues } from "@/lib/issues-context";
import { findBestMatches } from "@/lib/match";
import type { PetitionDraft } from "@/lib/types";
import { CATEGORY_LABELS, UPVOTE_THRESHOLD } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/category-ui";
import { categoryPlaceholder } from "@/lib/placeholders";

export function IssueDetailClient({ issueId }: { issueId: string }) {
  const { issues, upvote, markSent } = useIssues();
  const issue = issues.find((i) => i.id === issueId);
  const [petition, setPetition] = useState<PetitionDraft | null>(null);
  const [loadingPetition, setLoadingPetition] = useState(false);
  const [sentToast, setSentToast] = useState(false);

  const matches = useMemo(
    () => (issue ? findBestMatches(issue, 3) : []),
    [issue],
  );

  async function generatePetition() {
    if (!issue) return;
    setLoadingPetition(true);
    try {
      const res = await fetch("/api/petition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue,
          innovationId: matches[0]?.innovation.id,
        }),
      });
      const data = (await res.json()) as { petition: PetitionDraft };
      setPetition(data.petition);
    } finally {
      setLoadingPetition(false);
    }
  }

  function sendMailto() {
    if (!petition || !issue) return;
    const mailto = `mailto:demo@impakt-malopolska.pl?subject=${encodeURIComponent(petition.subject)}&body=${encodeURIComponent(petition.bodyText)}`;
    window.open(mailto, "_blank");
    markSent(issue.id);
    setSentToast(true);
    setTimeout(() => setSentToast(false), 3000);
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[17px] text-[var(--muted)]">Nie znaleziono zgłoszenia.</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-[var(--accent)]">
          Wróć
        </Link>
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[issue.category];
  const src =
    issue.imageUrl || categoryPlaceholder(issue.category, issue.title);
  const best = matches[0];

  return (
    <div className="mx-auto w-full max-w-lg pb-16">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="aspect-[4/3] w-full object-cover bg-[var(--wash)]"
        />
        <Link
          href="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 text-[14px] font-semibold text-[var(--ink)] shadow-sm backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć
        </Link>
      </div>

      <div className="space-y-5 px-4 pt-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[13px] text-[var(--muted)]">
            <Icon className="h-4 w-4" aria-hidden />
            {CATEGORY_LABELS[issue.category]} · {issue.status}
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink)]">
            {issue.title}
          </h1>
          <p className="mt-2 flex items-center gap-1 text-[15px] text-[var(--muted)]">
            <MapPin className="h-4 w-4 shrink-0" />
            {issue.locationName} · {issue.authorName}
          </p>
          <p className="mt-3 text-[17px] leading-relaxed text-[var(--ink)]">
            {issue.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => upvote(issue.id)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--wash)] px-4 py-2.5 text-[15px] font-semibold"
          >
            <Heart className="h-4 w-4 text-[#ff3b30]" fill="#ff3b30" />
            {issue.upvotes}
          </button>
          {issue.upvotes < UPVOTE_THRESHOLD && (
            <span className="text-[14px] text-[var(--muted)]">
              Do progu wniosku: {UPVOTE_THRESHOLD - issue.upvotes}
            </span>
          )}
        </div>

        <section aria-labelledby="match-heading">
          <h2
            id="match-heading"
            className="flex items-center gap-2 text-[20px] font-bold tracking-tight"
          >
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            Dopasowanie
          </h2>
          <p className="mt-1 text-[14px] text-[var(--muted)]">
            Matchmaking społeczny — podobne rozwiązania z regionu.
          </p>
          <ul className="mt-3 space-y-3">
            {matches.map(({ innovation, score }, index) => (
              <motion.li
                key={innovation.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className={`rounded-2xl p-4 ${
                  index === 0
                    ? "bg-[var(--accent-soft)]"
                    : "bg-[var(--surface)] shadow-sm"
                }`}
              >
                {index === 0 && (
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
                    Najlepsze · {score}
                  </p>
                )}
                <p className="text-[16px] font-semibold">{innovation.title}</p>
                <p className="text-[13px] text-[var(--muted)]">
                  {innovation.sourceMunicipality}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink)]">
                  {innovation.description}
                </p>
              </motion.li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="petition-heading" className="pb-8">
          <h2
            id="petition-heading"
            className="flex items-center gap-2 text-[20px] font-bold tracking-tight"
          >
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            Wniosek
          </h2>
          <button
            type="button"
            onClick={generatePetition}
            disabled={loadingPetition || !best}
            className="mt-3 w-full rounded-2xl bg-[var(--accent)] py-3.5 text-[17px] font-semibold text-white disabled:opacity-50"
          >
            {loadingPetition ? "Generuję…" : "Generuj wniosek (art. 241 KPA)"}
          </button>

          {petition && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3 rounded-2xl bg-[var(--surface)] p-4 shadow-sm"
            >
              <p className="text-[14px]">
                <span className="font-semibold">Do: </span>
                {petition.targetDepartment}
              </p>
              <p className="text-[14px]">
                <span className="font-semibold">Temat: </span>
                {petition.subject}
              </p>
              <pre className="whitespace-pre-wrap rounded-xl bg-[var(--wash)] p-4 font-sans text-[14px] leading-relaxed">
                {petition.bodyText}
              </pre>
              <button
                type="button"
                onClick={sendMailto}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] py-3.5 text-[17px] font-semibold text-white"
              >
                <Send className="h-4 w-4" />
                Wyślij (demo)
              </button>
            </motion.div>
          )}
        </section>
      </div>

      {sentToast && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-[14px] font-medium text-white"
        >
          Wysłano · heatmapa zaktualizowana
        </motion.div>
      )}
    </div>
  );
}
