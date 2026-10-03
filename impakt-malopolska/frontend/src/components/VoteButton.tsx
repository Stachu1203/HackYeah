import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Issue } from "../lib/types";

type Props = {
  issue: Issue;
  onToggle: (id: string) => Promise<unknown>;
  size?: "md" | "lg";
};

/** Poparcie zgłoszenia — jeden głos na osobę, drugie kliknięcie cofa głos. */
export function VoteButton({ issue, onToggle, size = "md" }: Props) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await onToggle(issue.id);
    } finally {
      setPending(false);
    }
  }

  const big = size === "lg";

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={issue.voted}
      aria-label={
        issue.voted
          ? `Cofnij poparcie: ${issue.title} (${issue.upvotes} głosów)`
          : `Poprzyj: ${issue.title} (${issue.upvotes} głosów)`
      }
      whileTap={{ scale: 0.92 }}
      className={`ink-btn inline-flex items-center gap-2 rounded-full font-bold disabled:cursor-wait ${
        big ? "px-5 py-2.5 text-[17px]" : "px-3.5 py-1.5 text-[15px]"
      } ${
        issue.voted
          ? "bg-[var(--riso-red)] text-[var(--surface)]"
          : "bg-[var(--surface)] text-[var(--ink)]"
      }`}
    >
      <motion.span
        key={issue.voted ? "on" : "off"}
        initial={{ scale: 0.6, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="flex"
      >
        <Heart
          className={big ? "h-5 w-5" : "h-4 w-4"}
          fill={issue.voted ? "currentColor" : "transparent"}
          color={issue.voted ? "currentColor" : "var(--riso-red)"}
          strokeWidth={2.5}
          aria-hidden
        />
      </motion.span>
      <span className="tabular-nums">{issue.upvotes}</span>
      <span className={big ? "" : "hidden sm:inline"}>
        {issue.voted ? "Popierasz" : "Popieram"}
      </span>
    </motion.button>
  );
}
