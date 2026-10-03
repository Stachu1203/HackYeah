import type { IssueCategory } from "./types";

const COLORS: Record<IssueCategory, { bg: string; fg: string }> = {
  INFRASTRUCTURE: { bg: "#e8e8ed", fg: "#1c1c1e" },
  EDUCATION: { bg: "#d6e4ff", fg: "#0033a0" },
  SAFETY: { bg: "#ffe8cc", fg: "#9a3412" },
  SENIORS: { bg: "#e8dff5", fg: "#5b21b6" },
  ACCESSIBILITY: { bg: "#d1fae5", fg: "#065f46" },
  HEALTH: { bg: "#ffe4e6", fg: "#9f1239" },
  COMMUNITY: { bg: "#e0f2fe", fg: "#075985" },
};

/** Offline-safe SVG placeholder “photo” per category */
export function categoryPlaceholder(
  category: IssueCategory,
  title: string,
): string {
  const { bg, fg } = COLORS[category];
  const safe = title.replace(/[<>&]/g, "").slice(0, 42);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#f2f2f7"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <circle cx="400" cy="250" r="64" fill="${fg}" fill-opacity="0.12"/>
  <text x="400" y="420" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif" font-size="28" font-weight="600" fill="${fg}">${safe}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export { COLORS as CATEGORY_COLORS };
