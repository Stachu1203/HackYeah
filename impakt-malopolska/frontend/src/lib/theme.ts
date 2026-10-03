import { useCallback, useSyncExternalStore } from "react";

/** „Kawaii mode” zamiast klasycznego dark mode — motyw zapisany w przeglądarce. */
export type Theme = "paper" | "kawaii";

const STORAGE_KEY = "impakt-theme";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "kawaii" ? "kawaii" : "paper";
}

function applyTheme(theme: Theme) {
  if (theme === "kawaii") document.documentElement.dataset.theme = "kawaii";
  else delete document.documentElement.dataset.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", theme === "kawaii" ? "#ffeef6" : "#f3ecdf");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // tryb prywatny / zablokowany storage — motyw działa do odświeżenia
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "paper" as Theme);
  const toggle = useCallback(() => applyTheme(readTheme() === "kawaii" ? "paper" : "kawaii"), []);
  return { theme, kawaii: theme === "kawaii", toggle };
}
