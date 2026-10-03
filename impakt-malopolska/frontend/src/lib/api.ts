import type { Innovation, Issue, IssueCategory, PetitionDraft } from "./types";

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

export type Match = { score: number; innovation: Innovation };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Błąd serwera (${res.status})`);
  }
  return data as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });

export const api = {
  listIssues: () => request<Issue[]>("/issues"),
  getIssue: (id: string) => request<Issue>(`/issues/${id}`),
  createIssue: (input: AddIssueInput) => post<Issue>("/issues", input),
  upvote: (id: string) => post<Issue>(`/issues/${id}/upvote`),
  markSent: (id: string) => post<Issue>(`/issues/${id}/sent`),
  matches: (id: string) =>
    request<{ matches: Match[]; best: Match | null }>(`/issues/${id}/matches`),
  petition: (id: string, innovationId?: string) =>
    post<{ petition: PetitionDraft; innovation: Innovation | null }>(
      `/issues/${id}/petition`,
      { innovationId },
    ),
  reset: () => post<{ ok: boolean }>("/reset"),
};
