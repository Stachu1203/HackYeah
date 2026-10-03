import { useTheme } from "../lib/theme";

const SPARKLES = [
  { top: "14%", left: "4%", size: 22, color: "#ffb3d4", delay: "0s", char: "✦" },
  { top: "32%", right: "5%", size: 18, color: "#c9bcff", delay: "0.8s", char: "♡" },
  { top: "58%", left: "6%", size: 16, color: "#ffd76e", delay: "1.6s", char: "✧" },
  { top: "78%", right: "8%", size: 24, color: "#ff9cc8", delay: "0.4s", char: "✦" },
  { top: "90%", left: "12%", size: 14, color: "#6cc4ff", delay: "2.2s", char: "♡" },
] as const;

/** Migoczące gwiazdki i serduszka w tle — tylko w kawaii mode, czysto dekoracyjne. */
export function KawaiiSparkles() {
  const { kawaii } = useTheme();
  if (!kawaii) return null;
  return (
    <div aria-hidden className="hidden sm:block">
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="kawaii-sparkle"
          style={{
            top: s.top,
            left: "left" in s ? s.left : undefined,
            right: "right" in s ? s.right : undefined,
            fontSize: s.size,
            color: s.color,
            animationDelay: s.delay,
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  );
}

/** Logo: w zwykłym trybie litera „i”, w kawaii mode — kotek. */
export function LogoMark() {
  const { kawaii } = useTheme();
  if (kawaii) {
    return (
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
        <path d="M8 16 9 5l9 7M32 16 31 5l-9 7" fill="#ffd1e6" stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" />
        <ellipse cx="20" cy="23" rx="14" ry="11.5" fill="#fff" stroke="var(--ink)" strokeWidth="2.2" />
        <circle cx="14.5" cy="22" r="1.9" fill="var(--ink)" />
        <circle cx="25.5" cy="22" r="1.9" fill="var(--ink)" />
        <path d="M18 26.5q2 1.8 4 0" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="11" cy="27" rx="2.4" ry="1.4" fill="#ff9cc8" />
        <ellipse cx="29" cy="27" rx="2.4" ry="1.4" fill="#ff9cc8" />
      </svg>
    );
  }
  return (
    <span className="font-display text-[20px] font-black italic text-[var(--surface)]">i</span>
  );
}
