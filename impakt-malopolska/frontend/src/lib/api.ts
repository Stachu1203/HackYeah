import type { Comment, Innovation, Issue, IssueCategory, PetitionDraft, User } from "./types";

export type AddIssueInput = {
  title: string;
  description: string;
  category: IssueCategory;
  latitude: number;
  longitude: number;
  locationName: string;
  imageUrl: string | null;
};

export type RegisterInput = {
  username: string;
  password: string;
  displayName?: string;
};

/** Błąd API z kodem HTTP — 401 oznacza brak zalogowania. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type Match = { score: number; innovation: Innovation };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error ?? `Błąd serwera (${res.status})`, res.status);
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
  removeUpvote: (id: string) =>
    request<Issue>(`/issues/${id}/upvote`, { method: "DELETE" }),
  markSent: (id: string) => post<Issue>(`/issues/${id}/sent`),
  matches: (id: string) =>
    request<{ matches: Match[]; best: Match | null }>(`/issues/${id}/matches`),
  petition: (id: string, innovationId?: string) =>
    post<{ petition: PetitionDraft; innovation: Innovation | null }>(
      `/issues/${id}/petition`,
      { innovationId },
    ),
  comments: (id: string) => request<Comment[]>(`/issues/${id}/comments`),
  addComment: (id: string, body: string) =>
    post<Comment>(`/issues/${id}/comments`, { body }),
  deleteComment: (commentId: string) =>
    request<{ ok: boolean }>(`/comments/${commentId}`, { method: "DELETE" }),
  reset: () => post<{ ok: boolean }>("/reset"),
  me: () => request<{ user: User | null }>("/auth/me"),
  login: (username: string, password: string) =>
    post<{ user: User }>("/auth/login", { username, password }),
  register: (input: RegisterInput) => post<{ user: User }>("/auth/register", input),
  logout: () => post<{ ok: boolean }>("/auth/logout"),
};
