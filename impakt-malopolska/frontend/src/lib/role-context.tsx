import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type DemoRole = "user" | "admin";

const STORAGE_KEY = "impakt-role-v1";

let role: DemoRole = "user";
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  if (!hydrated && typeof window !== "undefined") {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "admin" || raw === "user") role = raw;
    hydrated = true;
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return role;
}

function getServerSnapshot(): DemoRole {
  return "user";
}

type RoleContextValue = {
  role: DemoRole;
  setRole: (r: DemoRole) => void;
  isAdmin: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setRole = useCallback((r: DemoRole) => {
    role = r;
    localStorage.setItem(STORAGE_KEY, r);
    emit();
  }, []);

  const value = useMemo(
    () => ({ role: current, setRole, isAdmin: current === "admin" }),
    [current, setRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
