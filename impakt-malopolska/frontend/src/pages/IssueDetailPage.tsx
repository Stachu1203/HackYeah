import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, FileText, MapPin, Send, Sparkles, Trash2 } from "lucide-react";
import { api, type Match } from "../lib/api";
import { useIssues } from "../lib/issues-context";
import type { PetitionDraft, Vote } from "../lib/types";
import { CATEGORY_LABELS, UPVOTE_THRESHOLD } from "../lib/types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../lib/category-ui";
import { categoryPlaceholder } from "../lib/placeholders";
import { VoteButton } from "../components/VoteButton";
import { ImageCarousel } from "../components/ImageCarousel";
import { ReportButton } from "../components/ReportButton";
import { useKawaiiText } from "../lib/kawaii";
import { CommentsSection } from "../components/CommentsSection";
import { timeAgo } from "../components/IssueFeed";

const STATUS_LABELS = {
  DRAFT: "Zbiera poparcie",
  READY_TO_SEND: "Gotowe do wniosku",
  SENT: "Wysłano do urzędu",
} as const;

export function IssueDetailPage() {
  const { id: issueId = "" } = useParams();
  const { issues, ready, vote, markSent, removeIssue } = useIssues();
  const navigate = useNavigate();
  const k = useKawaiiText();
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  async function handleVote(id: string, value: Vote) {
    try {
      await vote(id, value);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Nie udało się zagłosować");
    }
  }

  async function handleDelete() {
    if (!issue) return;
    try {
      await removeIssue(issue.id);
      navigate("/", { replace: true });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Nie udało się usunąć zgłoszenia");
    }
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
      <p role="status" className="py-16 text-center font-display text-[18px] italic text-[var(--muted)]">
        {k("Szukamy kartki…", "Chotto matte… ちょっと待って")}
      </p>
    );
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="paper-card p-8 text-center">
          <span className="tape" aria-hidden />
          <p className="font-display text-[26px] font-bold italic">Kartka odpadła</p>
          <p className="mt-2 text-[15px] text-[var(--muted)]">
            Nie znaleziono zgłoszenia — mogło wygasnąć po 7 dniach.
          </p>
          <Link
            to="/"
            className="ink-btn mt-6 inline-flex rounded-full bg-[var(--riso-yellow)] px-5 py-2 font-bold"
          >
            Wróć do tablicy
          </Link>
        </div>
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[issue.category];
  const colors = CATEGORY_COLORS[issue.category];
  const fallback = categoryPlaceholder(issue.category, issue.title);
  const progress = Math.min(1, Math.max(0, issue.score) / UPVOTE_THRESHOLD);

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-20 pt-6">
      <Link
        to="/"
        className="ink-btn mb-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3.5 py-1.5 text-[14px] font-bold"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Tablica
      </Link>

      <div className="paper-card -rotate-[0.6deg] p-3">
        <span className="tape" aria-hidden />
        <div className="relative overflow-hidden rounded-xl border-2 border-[var(--ink)]">
          <ImageCarousel images={issue.images} fallback={fallback} label={issue.title} />
          {issue.status !== "DRAFT" && (
            <span
              className={`stamp absolute bottom-4 right-4 text-[13px] ${
                issue.status === "SENT" ? "text-[var(--riso-blue)]" : "text-[var(--riso-red)]"
              }`}
            >
              {STATUS_LABELS[issue.status]}
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-10">
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--ink)] px-2.5 py-0.5 text-[12px] font-bold"
              style={{ background: colors.bg }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: colors.fg }} aria-hidden />
              {CATEGORY_LABELS[issue.category]}
            </span>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">
              {STATUS_LABELS[issue.status]}
            </span>
          </div>
          <h1 className="font-display text-[30px] font-black leading-[1.05] sm:text-[38px] sm:leading-[1.02] tracking-tight text-[var(--ink)]">
            {issue.title}
          </h1>
          <p className="mt-3 flex items-center gap-1.5 text-[14px] font-medium text-[var(--muted)]">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {issue.locationName} · {issue.authorName} · {timeAgo(issue.createdAt)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {/* autor i urząd mogą usunąć — zgłaszanie jest dla pozostałych */}
            {!issue.canDelete && <ReportButton target={{ issueId: issue.id }} label={issue.title} />}
            {issue.canDelete &&
              (confirmDelete ? (
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-[#fbd3c9] px-3 py-1 text-[13px] font-bold">
                  Usunąć na pewno?
                  <button type="button" onClick={() => void handleDelete()} className="underline">
                    Tak
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="underline">
                    Nie
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[13px] font-semibold text-[var(--muted)] transition hover:text-[var(--riso-red)]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Usuń zgłoszenie
                </button>
              ))}
          </div>
          <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink)] sm:text-[18px]">
            {issue.description}
          </p>

          <div className="paper-card mt-6 flex flex-wrap items-center gap-4 p-4">
            <VoteButton issue={issue} onVote={handleVote} size="lg" />
            <div className="min-w-[10rem] flex-1">
              <p className="text-[13px] font-bold">
                {issue.score >= UPVOTE_THRESHOLD
                  ? k("Próg wniosku osiągnięty", "Próg osiągnięty! すごい ✧")
                  : `Do progu wniosku: ${UPVOTE_THRESHOLD - issue.score}`}
              </p>
              <p className="text-[12px] text-[var(--muted)]">
                ▲ {issue.upvotes} za · ▼ {issue.downvotes} przeciw
              </p>
              <div
                className="mt-1.5 h-3 overflow-hidden rounded-full border-2 border-[var(--ink)] bg-[var(--surface)]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={UPVOTE_THRESHOLD}
                aria-valuenow={Math.min(Math.max(0, issue.score), UPVOTE_THRESHOLD)}
                aria-label="Poparcie do progu wniosku"
              >
                <motion.div
                  className="h-full bg-[var(--riso-red)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ type: "spring", damping: 20 }}
                />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="match-heading">
          <h2
            id="match-heading"
            className="flex items-center gap-2 font-display text-[28px] font-black italic tracking-tight"
          >
            <Sparkles className="h-6 w-6 text-[var(--riso-yellow)]" fill="currentColor" aria-hidden />
            Dopasowanie
          </h2>
          <p className="mt-1 text-[14px] text-[var(--muted)]">
            Sprawdzone rozwiązania z innych gmin Małopolski, dobrane po treści zgłoszenia.
          </p>
          {matches.length === 0 && (
            <p className="paper-card mt-4 p-4 text-[15px] text-[var(--muted)]">
              Brak podobnych innowacji w bibliotece — wniosek powstanie bez wskazania wzoru.
            </p>
          )}
          <ul className="mt-5 space-y-5">
            {matches.map(({ innovation, score }, index) => (
              <motion.li
                key={innovation.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`paper-card p-4 ${
                  index === 0 ? "rotate-[0.5deg] bg-[#fdf1cf]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {index === 0 && (
                      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--riso-red)]">
                        Najlepsze dopasowanie
                      </p>
                    )}
                    <p className="font-display text-[19px] font-bold leading-snug">
                      {innovation.title}
                    </p>
                    <p className="text-[13px] font-semibold text-[var(--muted)]">
                      {innovation.sourceMunicipality} · {innovation.grantHint}
                    </p>
                  </div>
                  <span
                    className="flex h-14 w-14 shrink-0 rotate-6 flex-col items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] leading-none"
                    title="Podobieństwo treści"
                  >
                    <span className="font-display text-[19px] font-black">{score}</span>
                    <span className="text-[9px] font-bold uppercase">% zgod.</span>
                  </span>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink)]">
                  {innovation.description}
                </p>
              </motion.li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="petition-heading">
          <h2
            id="petition-heading"
            className="flex items-center gap-2 font-display text-[28px] font-black italic tracking-tight"
          >
            <FileText className="h-6 w-6 text-[var(--riso-blue)]" aria-hidden />
            Wniosek
          </h2>
          <button
            type="button"
            onClick={generatePetition}
            disabled={loadingPetition}
            className="ink-btn mt-4 w-full rounded-2xl bg-[var(--riso-blue)] py-3.5 text-[17px] font-extrabold text-[var(--surface)] disabled:opacity-60"
          >
            {loadingPetition ? "Piszę…" : "Napisz wniosek (art. 241 KPA)"}
          </button>

          {petition && (
            <motion.div
              initial={{ opacity: 0, y: 16, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: -0.4 }}
              className="paper-card lined-paper mt-6 space-y-3 p-5"
            >
              <span className="tape" aria-hidden />
              <p className="font-mono text-[14px]">
                <span className="font-bold">Do: </span>
                {petition.targetDepartment}
              </p>
              <p className="font-mono text-[14px]">
                <span className="font-bold">Temat: </span>
                {petition.subject}
              </p>
              <pre className="whitespace-pre-wrap font-mono text-[14px]">
                {petition.bodyText}
              </pre>
              <button
                type="button"
                onClick={sendMailto}
                className="ink-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] py-3.5 text-[17px] font-extrabold text-[var(--surface)]"
              >
                <Send className="h-4 w-4" aria-hidden />
                Wyślij (demo)
              </button>
            </motion.div>
          )}
        </section>

        <CommentsSection issueId={issue.id} />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full border-2 border-[var(--ink)] bg-[var(--riso-yellow)] px-5 py-2.5 text-[14px] font-bold shadow-[3px_3px_0_var(--shadow)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
