import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ban, Check, Flag, ShieldOff, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useIssues } from "../lib/issues-context";
import type { AbuseReport, BannedUser } from "../lib/types";
import { timeAgo } from "./IssueFeed";

/** Panel urzędu: zgłoszenia nadużyć i zablokowane konta. */
export function ModerationPanel() {
  const { refresh } = useIssues();
  const [reports, setReports] = useState<AbuseReport[] | null>(null);
  const [bans, setBans] = useState<BannedUser[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, b] = await Promise.all([api.adminReports(), api.adminBans()]);
      setReports(r);
      setBans(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wczytać zgłoszeń");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await Promise.all([load(), refresh()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Akcja się nie powiodła");
    } finally {
      setBusyId(null);
    }
  }

  const btn =
    "ink-btn inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold disabled:opacity-50";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <section className="paper-card p-4" aria-labelledby="reports-heading">
        <h2 id="reports-heading" className="flex items-center gap-2 font-display text-[22px] font-black italic">
          <Flag className="h-5 w-5 text-[var(--riso-red)]" aria-hidden />
          Zgłoszenia nadużyć
          {reports && reports.length > 0 && (
            <span className="rounded-full border-2 border-[var(--ink)] bg-[var(--riso-red)] px-2 font-sans text-[13px] not-italic text-[var(--surface)]">
              {reports.length}
            </span>
          )}
        </h2>
        {error && (
          <p role="alert" className="mt-3 rounded-xl border-2 border-[var(--ink)] bg-[#fbd3c9] px-3 py-2 text-[14px] font-semibold">
            {error}
          </p>
        )}
        {reports === null ? (
          <p className="mt-3 text-[14px] italic text-[var(--muted)]">Wczytywanie…</p>
        ) : reports.length === 0 ? (
          <p className="mt-3 text-[14px] text-[var(--muted)]">Brak otwartych zgłoszeń. Spokojnie na tablicy ✓</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] p-3">
                <p className="text-[12px] font-semibold text-[var(--muted)]">
                  {r.reporterName} · {timeAgo(r.createdAt)} · {r.commentId ? "komentarz" : "post"}
                </p>
                <p className="mt-1 text-[14px] font-bold text-[var(--riso-red)]">„{r.reason}”</p>
                <div className="mt-2 rounded-lg bg-[var(--wash)] px-2.5 py-2 text-[14px]">
                  {r.commentBody ? (
                    <p className="line-clamp-3 whitespace-pre-wrap break-words">{r.commentBody}</p>
                  ) : (
                    <p className="font-semibold">{r.issueTitle ?? "(zgłoszenie usunięte)"}</p>
                  )}
                  {r.issueId && (
                    <Link to={`/zgloszenie/${r.issueId}`} className="mt-1 inline-block text-[12px] font-bold text-[var(--accent)] underline">
                      Otwórz zgłoszenie →
                    </Link>
                  )}
                </div>
                <p className="mt-2 text-[12px] text-[var(--muted)]">
                  Autor:{" "}
                  {r.target ? (
                    <strong className="text-[var(--ink)]">
                      {r.target.displayName} (@{r.target.username}){r.target.banned ? " · zablokowany" : ""}
                    </strong>
                  ) : (
                    "dane startowe (bez konta)"
                  )}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => void act(r.id, () => api.resolveReport(r.id, { deleteContent: true }))}
                    className={`${btn} bg-[var(--riso-yellow)]`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Usuń treść
                  </button>
                  {r.target && !r.target.banned && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() =>
                        void act(r.id, () =>
                          api.resolveReport(r.id, { deleteContent: true, banAuthor: true, banReason: r.reason }),
                        )
                      }
                      className={`${btn} bg-[var(--riso-red)] text-[var(--surface)]`}
                    >
                      <Ban className="h-3.5 w-3.5" aria-hidden />
                      Usuń i zablokuj autora
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => void act(r.id, () => api.dismissReport(r.id))}
                    className={`${btn} bg-[var(--surface)]`}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    Odrzuć
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="paper-card p-4" aria-labelledby="bans-heading">
        <h2 id="bans-heading" className="flex items-center gap-2 font-display text-[22px] font-black italic">
          <Ban className="h-5 w-5" aria-hidden />
          Zablokowane konta
        </h2>
        {bans.length === 0 ? (
          <p className="mt-3 text-[14px] text-[var(--muted)]">Nikt nie jest zablokowany.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {bans.map((b) => (
              <li key={b.id} className="flex items-center gap-2 rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold">
                    {b.displayName} <span className="font-normal text-[var(--muted)]">@{b.username}</span>
                  </p>
                  <p className="truncate text-[12px] text-[var(--muted)]">
                    {timeAgo(b.bannedAt)}
                    {b.reason ? ` · ${b.reason}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === b.id}
                  onClick={() => void act(b.id, () => api.unban(b.id))}
                  className={`${btn} shrink-0 bg-[var(--riso-mint)] text-[var(--surface)]`}
                >
                  <ShieldOff className="h-3.5 w-3.5" aria-hidden />
                  Odblokuj
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 flex items-start gap-1.5 text-[12px] text-[var(--muted)]">
          <Check className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          Zablokowane konto nie zaloguje się, nie zagłosuje, nie skomentuje i nie doda zgłoszenia.
        </p>
      </section>
    </div>
  );
}
