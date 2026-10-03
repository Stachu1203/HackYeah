import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { useKawaiiText } from "../lib/kawaii";
import type { Issue, Vote } from "../lib/types";

type Props = {
  issue: Issue;
  onVote: (id: string, value: Vote) => Promise<unknown>;
  size?: "md" | "lg";
};

/**
 * Głos za / przeciw — jeden na konto. Kliknięcie aktywnej strzałki cofa głos.
 * Bez konta prowadzi do logowania.
 */
export function VoteButton({ issue, onVote, size = "md" }: Props) {
  const [pending, setPending] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const k = useKawaiiText();
  const big = size === "lg";

  async function cast(direction: 1 | -1) {
    if (pending) return;
    if (!user) {
      navigate("/logowanie", { state: { from: pathname } });
      return;
    }
    setPending(true);
    try {
      await onVote(issue.id, issue.myVote === direction ? 0 : direction);
    } finally {
      setPending(false);
    }
  }

  const arrow = big ? "h-6 w-6" : "h-5 w-5";
  const btn = `flex items-center justify-center rounded-full transition disabled:cursor-wait ${
    big ? "h-10 w-10" : "h-8 w-8"
  }`;

  return (
    <div
      className={`ink-btn inline-flex items-center rounded-full bg-[var(--surface)] p-0.5 ${
        big ? "gap-1" : ""
      }`}
      role="group"
      aria-label={`Głosowanie: wynik ${issue.score}`}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => void cast(1)}
        disabled={pending}
        aria-pressed={issue.myVote === 1}
        aria-label={issue.myVote === 1 ? "Cofnij głos za" : `Głosuj za: ${issue.title}`}
        title={k("Popieram", "Popieram ♡ いいね!")}
        className={`${btn} ${
          issue.myVote === 1
            ? "bg-[var(--riso-red)] text-[var(--surface)]"
            : "text-[var(--riso-red)] hover:bg-[var(--wash)]"
        }`}
      >
        <ArrowBigUp
          className={arrow}
          fill={issue.myVote === 1 ? "currentColor" : "transparent"}
          strokeWidth={2.2}
          aria-hidden
        />
      </motion.button>
      <motion.span
        key={issue.score}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`min-w-[2ch] text-center font-bold tabular-nums ${big ? "text-[19px]" : "text-[15px]"} ${
          issue.score < 0 ? "text-[var(--riso-blue)]" : ""
        }`}
        aria-live="polite"
      >
        {issue.score}
      </motion.span>
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => void cast(-1)}
        disabled={pending}
        aria-pressed={issue.myVote === -1}
        aria-label={issue.myVote === -1 ? "Cofnij głos przeciw" : `Głosuj przeciw: ${issue.title}`}
        title={k("Nie popieram", "Nie popieram (´・ω・`)")}
        className={`${btn} ${
          issue.myVote === -1
            ? "bg-[var(--riso-blue)] text-[var(--surface)]"
            : "text-[var(--riso-blue)] hover:bg-[var(--wash)]"
        }`}
      >
        <ArrowBigDown
          className={arrow}
          fill={issue.myVote === -1 ? "currentColor" : "transparent"}
          strokeWidth={2.2}
          aria-hidden
        />
      </motion.button>
    </div>
  );
}
