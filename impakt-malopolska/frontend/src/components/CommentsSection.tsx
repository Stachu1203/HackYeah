import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Shield, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useIssues } from "../lib/issues-context";
import { useTheme } from "../lib/theme";
import type { Comment } from "../lib/types";
import { timeAgo } from "./IssueFeed";
import { ReportButton } from "./ReportButton";
import { useKawaiiText } from "../lib/kawaii";

const MAX_CHARS = 1000;
const MEOW_SUFFIX = /(?:^|\s+)meow\s+meow[\s.!?♡]*$/i;

/** Kawaii mode zawsze kończy komentarz na „meow meow”, zwykły tryb nigdy go nie pokazuje. */
export function displayBody(body: string, kawaii: boolean): string {
  const plain = body.replace(MEOW_SUFFIX, "");
  if (kawaii) return plain ? `${plain} meow meow` : "meow meow";
  return plain || "…";
}

export function CommentsSection({ issueId }: { issueId: string }) {
  const { user } = useAuth();
  const { refresh } = useIssues();
  const { kawaii } = useTheme();
  const k = useKawaiiText();
  const { pathname, hash } = useLocation();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;
  useEffect(() => {
    let cancelled = false;
    api
      .comments(issueId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
    // userId: po zalogowaniu zmieniają się uprawnienia do usuwania
  }, [issueId, userId]);

  // Link z karty (#komentarze) — router nie przewija sam do kotwicy.
  const loaded = comments !== null;
  useEffect(() => {
    if (loaded && hash === "#komentarze") {
      document.getElementById("komentarze")?.scrollIntoView({ block: "start" });
    }
  }, [loaded, hash]);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const comment = await api.addComment(issueId, text);
      setComments((prev) => [...(prev ?? []), comment]);
      setBody("");
      void refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać komentarza");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.deleteComment(id);
      setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
      void refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć komentarza");
    }
  }

  return (
    <section id="komentarze" aria-labelledby="comments-heading" className="scroll-mt-20">
      <h2
        id="comments-heading"
        className="flex items-center gap-2 font-display text-[26px] font-black italic tracking-tight sm:text-[28px]"
      >
        <MessageCircle className="h-6 w-6 text-[var(--riso-mint)]" aria-hidden />
        Komentarze
        {comments && comments.length > 0 && (
          <span className="rounded-full border-2 border-[var(--ink)] bg-[var(--riso-mint)] px-2 py-0.5 font-sans text-[13px] font-bold not-italic text-[var(--surface)]">
            {comments.length}
          </span>
        )}
      </h2>
      <p className="mt-1 text-[14px] text-[var(--muted)]">
        Dopisz, co widzisz na miejscu — to wzmacnia wniosek.
      </p>

      {comments === null ? (
        <p role="status" className="mt-4 text-[15px] italic text-[var(--muted)]">
          Wczytywanie…
        </p>
      ) : comments.length === 0 ? (
        <p className="paper-card mt-4 p-4 text-[15px] text-[var(--muted)]">
          {k("Nikt jeszcze nie skomentował. Bądź pierwszy!", "Nikt jeszcze nie skomentował… Bądź pierwszy! がんばって ♡")}
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          <AnimatePresence initial={false}>
            {comments.map((c, index) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`paper-card p-3.5 sm:p-4 ${index % 2 ? "rotate-[0.3deg]" : "-rotate-[0.3deg]"} ${
                  c.authorRole === "admin" ? "bg-[#e6eafc]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px]">
                    <span className="font-bold">{c.authorName}</span>
                    {c.authorRole === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-[var(--ink)] bg-[var(--riso-blue)] px-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--surface)]">
                        <Shield className="h-2.5 w-2.5" aria-hidden />
                        Urząd
                      </span>
                    )}
                    <span className="text-[12px] text-[var(--muted)]">{timeAgo(c.createdAt)}</span>
                  </p>
                  {!c.canDelete && (
                    <ReportButton
                      compact
                      target={{ commentId: c.id }}
                      label={`komentarz: ${c.body.slice(0, 40)}`}
                    />
                  )}
                  {c.canDelete && (
                    <button
                      type="button"
                      onClick={() => void remove(c.id)}
                      className="-m-1 shrink-0 rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--wash)] hover:text-[var(--riso-red)]"
                      aria-label={`Usuń komentarz: ${c.body.slice(0, 40)}`}
                      title="Usuń komentarz"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {displayBody(c.body, kawaii)}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border-2 border-[var(--ink)] bg-[#fbd3c9] px-3 py-2 text-[14px] font-semibold"
        >
          {error}
        </p>
      )}

      {user ? (
        <form onSubmit={submit} className="paper-card mt-6 p-3.5 sm:p-4">
          <label htmlFor="comment-body" className="block text-[12px] font-extrabold uppercase tracking-[0.14em]">
            Twój komentarz · {user.displayName}
          </label>
          <textarea
            id="comment-body"
            rows={3}
            value={body}
            maxLength={MAX_CHARS}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(e);
            }}
            placeholder="Np. „Byłam tam wczoraj, problem nadal jest”"
            className="mt-2 w-full resize-y rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-2.5 text-[16px] outline-none transition focus:shadow-[3px_3px_0_var(--riso-blue)]"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-mono text-[12px] text-[var(--muted)]">
              {body.length}/{MAX_CHARS}
            </span>
            <button
              type="submit"
              disabled={busy || !body.trim()}
              className="ink-btn rounded-full bg-[var(--riso-mint)] px-5 py-2 text-[15px] font-extrabold text-[var(--surface)] disabled:opacity-50"
            >
              {busy ? k("JEV sprawdza…", "JEV sprawdza… ちょっと待って") : k("Skomentuj", "Skomentuj ♡")}
            </button>
          </div>
        </form>
      ) : (
        <div className="paper-card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-[15px]">Zaloguj się, żeby dodać komentarz.</p>
          <Link
            to="/logowanie"
            state={{ from: pathname }}
            className="ink-btn rounded-full bg-[var(--riso-yellow)] px-4 py-1.5 text-[14px] font-bold"
          >
            Zaloguj
          </Link>
        </div>
      )}
    </section>
  );
}
