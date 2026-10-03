import type { IssueCategory } from "./types";

/** Dwie farby risograficzne na kategorię: `bg` — tło etykiet, `fg` — główny tusz. */
const COLORS: Record<IssueCategory, { bg: string; fg: string; second: string }> = {
  INFRASTRUCTURE: { bg: "#fbe3a6", fg: "#c98a0b", second: "#2b4acb" },
  EDUCATION: { bg: "#dfe4fa", fg: "#2b4acb", second: "#f28db2" },
  SAFETY: { bg: "#fbd3c9", fg: "#e2402a", second: "#f0b429" },
  SENIORS: { bg: "#fbdbe7", fg: "#d0477c", second: "#2b4acb" },
  ACCESSIBILITY: { bg: "#cfeee3", fg: "#2f9e7f", second: "#f0b429" },
  HEALTH: { bg: "#f8d3d9", fg: "#c9304d", second: "#1f8ea3" },
  COMMUNITY: { bg: "#cdeaf0", fg: "#1f8ea3", second: "#e2402a" },
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Offline-owa abstrakcyjna „grafika” zgłoszenia w stylu druku risograficznego (bez tekstu — tytuł jest pod nią). */
export function categoryPlaceholder(
  category: IssueCategory,
  title: string,
): string {
  const { fg, second } = COLORS[category];
  const h = hash(title);
  const cx = 330 + (h % 140);
  const cy = 250 + ((h >> 8) % 100);
  const r = 190 + ((h >> 16) % 50);
  const rot = (h % 30) - 15;
  const sx = 120 + ((h >> 4) % 520);
  const sy = 80 + ((h >> 12) % 420);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">
      <circle cx="7" cy="7" r="4.2" fill="${fg}"/>
    </pattern>
    <pattern id="lines" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(${45 + rot})">
      <rect width="5" height="12" fill="${second}"/>
    </pattern>
  </defs>
  <rect width="800" height="600" fill="#f6efe2"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#dots)"/>
  <rect x="${cx - r * 1.1}" y="${cy - 30}" width="${r * 1.3}" height="${r * 0.9}" rx="18" fill="${second}" opacity="0.85" style="mix-blend-mode:multiply" transform="rotate(${rot} ${cx} ${cy})"/>
  <circle cx="${cx + 8}" cy="${cy + 6}" r="${r * 0.42}" fill="${fg}" opacity="0.9" style="mix-blend-mode:multiply"/>
  <rect x="0" y="${sy}" width="800" height="54" fill="url(#lines)" opacity="0.45" transform="rotate(${-rot / 2} 400 ${sy})"/>
  <path d="M${sx} 40 l14 34 36 4 -28 22 10 36 -32 -20 -32 20 10 -36 -28 -22 36 -4z" fill="#1f1b16" opacity="0.85" transform="rotate(${rot} ${sx} 80)"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export { COLORS as CATEGORY_COLORS };
