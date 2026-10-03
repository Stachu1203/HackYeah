import { useCallback } from "react";
import { useTheme } from "./theme";

/**
 * Japońskie zwroty w kawaii mode: `k("Ładowanie…", "Chotto matte ちょっと待って")`
 * zwraca pierwszy tekst w zwykłym trybie, drugi w kawaii.
 */
export function useKawaiiText() {
  const { kawaii } = useTheme();
  return useCallback((plain: string, cute: string) => (kawaii ? cute : plain), [kawaii]);
}
