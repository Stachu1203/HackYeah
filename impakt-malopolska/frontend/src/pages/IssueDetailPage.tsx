import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Heart,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import { api, type Match } from "../lib/api";
import { useIssues } from "../lib/issues-context";
import type { PetitionDraft } from "../lib/types";
import { CATEGORY_LABELS, UPVOTE_THRESHOLD } from "../lib/types";
import { CATEGORY_ICONS } from "../lib/category-ui";
import { categoryPlaceholder } from "../lib/placeholders";

export function IssueDetailPage() {
  const { id: issueId = "" } = useParams();
  const { issues, ready, upvote, markSent } = useIssues();
  const issue = issues.find((i) => i.id === issueId);
  const [matches, setMatches] = useState<Match[]>([]);
  const [petition, setPetition] = useState<PetitionDraft | null>(null);
  const [loadingPetition, setLoadingPetition] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .matches(issueId)
      .then((data) => {
        if (!cancelled) setMatches(data.matches);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [issueId]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  async function generatePetition() {
    if (!issue) return;
    setLoadingPetition(true);
    try {
      const data = await api.petition(issue.id, matches[0]?.innovation.id);
      setPetition(data.petition);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Nie udało się wygenerować wniosku");
    } finally {
      setLoadingPetition(false);
    }
  }

  async function sendMailto() {
    if (!petition || !issue) return;
    const mailto = `mailto:demo@impakt-malopolska.pl?subject=${encodeURIComponent(petition.subject)}&body=${encodeURIComponent(petition.bodyText)}`;
    window.open(mailto, "_blank");
    try {
      await markSent(issue.id);
      showToast("Wysłano · heatmapa zaktualizowana");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Nie udało się oznaczyć jako wysłane");
    }
  }

  if (!ready) {
    return (
      <p role="status" className="py-16 text-center text-[15px] text-[var(--muted)]">
        Ładowanie…
      </p>
    );
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[17px] text-[var(--muted)]">
          Nie znaleziono zgłoszenia — mogło wygasnąć po 7 dniach.
        </p>
        <Link to="/" className="mt-4 inline-block font-semibold text-[var(--accent)]">
          Wróć
        </Link>
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[issue.category];
  const src =
    issue.imageUrl || categoryPlaceholder(issue.category, issue.title);

  return (
    <div className="mx-auto w-full max-w-lg pb-16">
      <div className="relative">
        <img
          src={src}
          alt=""
          className="aspect-[4/3] w-full object-cover bg-[var(--wash)]"
        />
        <Link
          to="/"
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
            onClick={() =>
              upvote(issue.id).catch((e: unknown) =>
                showToast(e instanceof Error ? e.message : "Nie udało się poprzeć"),
              )
            }
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
            Matchmaking społeczny na embeddingach — podobne rozwiązania z regionu.
          </p>
          {matches.length === 0 && (
            <p className="mt-3 rounded-2xl bg-[var(--surface)] p-4 text-[15px] text-[var(--muted)] shadow-sm">
              Brak podobnych innowacji w bibliotece — wniosek powstanie bez wskazania wzoru.
            </p>
          )}
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
                    Najlepsze · {score}% podobieństwa
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
            disabled={loadingPetition}
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

      {toast && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-[14px] font-medium text-white"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
