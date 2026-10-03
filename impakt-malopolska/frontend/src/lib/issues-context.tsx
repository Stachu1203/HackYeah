import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type AddIssueInput } from "./api";
import type { Issue } from "./types";

type IssuesContextValue = {
  issues: Issue[];
  ready: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addIssue: (input: AddIssueInput) => Promise<Issue>;
  upvote: (id: string) => Promise<Issue>;
  markSent: (id: string) => Promise<Issue>;
  reset: () => Promise<void>;
};

const IssuesContext = createContext<IssuesContextValue | null>(null);

export function IssuesProvider({ children }: { children: ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIssues(await api.listIssues());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Brak połączenia z serwerem");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const replace = useCallback((updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    return updated;
  }, []);

  const addIssue = useCallback(async (input: AddIssueInput) => {
    const issue = await api.createIssue(input);
    setIssues((prev) => [issue, ...prev]);
    return issue;
  }, []);

  const upvote = useCallback(
    async (id: string) => replace(await api.upvote(id)),
    [replace],
  );

  const markSent = useCallback(
    async (id: string) => replace(await api.markSent(id)),
    [replace],
  );

  const reset = useCallback(async () => {
    await api.reset();
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ issues, ready, error, refresh, addIssue, upvote, markSent, reset }),
    [issues, ready, error, refresh, addIssue, upvote, markSent, reset],
  );

  return (
    <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>
  );
}

export function useIssues() {
  const ctx = useContext(IssuesContext);
  if (!ctx) throw new Error("useIssues must be used within IssuesProvider");
  return ctx;
}
