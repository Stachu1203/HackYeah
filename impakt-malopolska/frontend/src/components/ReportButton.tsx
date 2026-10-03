import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Flag, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";

const REASONS = ["Obraźliwe treści", "Spam lub reklama", "Dane osobowe", "Nieprawdziwe informacje"];

type Props = {
  target: { issueId: string } | { commentId: string };
  /** krótka etykieta dla czytnika ekranu */
  label: string;
  compact?: boolean;
};

/** „Zgłoś nadużycie” — trafia do kolejki urzędu w panelu. */
export function ReportButton({ target, label, compact = false }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    if (!user) {
      navigate("/logowanie", { state: { from: pathname } });
      return;
    }
    setState("idle");
    setError(null);
    setOpen(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("busy");
    setError(null);
    try {
      await api.report(target, details.trim() ? `${reason}: ${details.trim()}` : reason);
      setState("done");
      setTimeout(() => setOpen(false), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać zgłoszenia");
      setState("idle");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={`inline-flex items-center gap-1 rounded-full text-[13px] font-semibold text-[var(--muted)] transition hover:text-[var(--riso-red)] ${
          compact ? "-m-1 p-2" : "px-2 py-1.5"
        }`}
        aria-label={`Zgłoś nadużycie: ${label}`}
        title="Zgłoś nadużycie"
      >
        <Flag className="h-4 w-4" aria-hidden />
        {!compact && <span>Zgłoś</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-[#1f1b16]/55 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.form
              onSubmit={submit}
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 30 }}
              className="w-full max-w-md rounded-t-[26px] border-2 border-[var(--ink)] bg-[var(--background)] p-5 shadow-[6px_6px_0_var(--shadow)] sm:rounded-[26px]"
            >
              <div className="flex items-center justify-between">
                <h2 id="report-title" className="font-display text-[24px] font-black italic">
                  Zgłoś nadużycie
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ink-btn rounded-full bg-[var(--surface)] p-1.5"
                  aria-label="Zamknij"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              {state === "done" ? (
                <p className="mt-4 rounded-xl border-2 border-[var(--ink)] bg-[var(--riso-mint)] px-3 py-3 font-bold text-[var(--surface)]">
                  Dziękujemy — urząd przejrzy zgłoszenie.
                </p>
              ) : (
                <>
                  <fieldset className="mt-4 space-y-2">
                    <legend className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.14em]">Powód</legend>
                    {REASONS.map((r) => (
                      <label
                        key={r}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-[15px] font-semibold ${
                          reason === r ? "border-[var(--ink)] bg-[var(--surface)]" : "border-transparent"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="accent-[var(--riso-red)]"
                        />
                        {r}
                      </label>
                    ))}
                  </fieldset>
                  <label className="mt-3 block text-[12px] font-extrabold uppercase tracking-[0.14em]">
                    Szczegóły (opcjonalnie)
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-2 text-[15px] font-normal normal-case tracking-normal outline-none"
                    />
                  </label>
                  {error && (
                    <p role="alert" className="mt-3 rounded-xl border-2 border-[var(--ink)] bg-[#fbd3c9] px-3 py-2 text-[14px] font-semibold">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={state === "busy"}
                    className="ink-btn mt-4 w-full rounded-2xl bg-[var(--riso-red)] py-3 text-[16px] font-extrabold text-[var(--surface)] disabled:opacity-60"
                  >
                    {state === "busy" ? "Wysyłam…" : "Wyślij do urzędu"}
                  </button>
                </>
              )}
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
