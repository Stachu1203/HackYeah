"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SEED_ISSUES } from "@/lib/seed";
import type { Issue, IssueCategory } from "@/lib/types";
import { UPVOTE_THRESHOLD } from "@/lib/types";

const STORAGE_KEY = "impakt-malopolska-issues-v2";

export type AddIssueInput = {
  title: string;
  description: string;
  category: IssueCategory;
  latitude: number;
  longitude: number;
  locationName: string;
  imageUrl: string | null;
  authorName?: string;
};

type IssuesContextValue = {
  issues: Issue[];
  ready: boolean;
  addIssue: (input: AddIssueInput) => Issue;
  upvote: (id: string) => Issue | undefined;
  markSent: (id: string) => void;
  reset: () => void;
};

const IssuesContext = createContext<IssuesContextValue | null>(null);

let memoryIssues: Issue[] = SEED_ISSUES;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readStorage(): Issue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_ISSUES;
    const parsed = JSON.parse(raw) as Issue[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_ISSUES;
    return parsed;
  } catch {
    return SEED_ISSUES;
  }
}

function writeStorage(issues: Issue[]) {
  memoryIssues = issues;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  emit();
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    memoryIssues = readStorage();
    hydrated = true;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return memoryIssues;
}

function getServerSnapshot() {
  return SEED_ISSUES;
}

export function IssuesProvider({ children }: { children: ReactNode }) {
  const issues = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const addIssue = useCallback((input: AddIssueInput) => {
    const keywords = input.description
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 8);
    const issue: Issue = {
      id: `iss-${Date.now()}`,
      title: input.title,
      description: input.description,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      locationName: input.locationName,
      upvotes: 1,
      status: "DRAFT",
      imageUrl: input.imageUrl,
      authorName: input.authorName?.trim() || "Ty",
      createdAt: new Date().toISOString(),
      keywords,
    };
    writeStorage([issue, ...memoryIssues]);
    return issue;
  }, []);

  const upvote = useCallback((id: string) => {
    let updated: Issue | undefined;
    writeStorage(
      memoryIssues.map((issue) => {
        if (issue.id !== id) return issue;
        const upvotes = issue.upvotes + 1;
        const status =
          upvotes >= UPVOTE_THRESHOLD && issue.status === "DRAFT"
            ? "READY_TO_SEND"
            : issue.status;
        updated = { ...issue, upvotes, status };
        return updated;
      }),
    );
    return updated;
  }, []);

  const markSent = useCallback((id: string) => {
    writeStorage(
      memoryIssues.map((issue) =>
        issue.id === id ? { ...issue, status: "SENT" as const } : issue,
      ),
    );
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    memoryIssues = SEED_ISSUES;
    hydrated = true;
    emit();
  }, []);

  const value = useMemo(
    () => ({
      issues,
      ready: true,
      addIssue,
      upvote,
      markSent,
      reset,
    }),
    [issues, addIssue, upvote, markSent, reset],
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
