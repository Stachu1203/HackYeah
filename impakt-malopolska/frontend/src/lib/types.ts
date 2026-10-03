export type IssueCategory =
  | "INFRASTRUCTURE"
  | "EDUCATION"
  | "SAFETY"
  | "SENIORS"
  | "ACCESSIBILITY"
  | "HEALTH"
  | "COMMUNITY";

export type IssueStatus = "DRAFT" | "READY_TO_SEND" | "SENT";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  latitude: number;
  longitude: number;
  locationName: string;
  upvotes: number;
  downvotes: number;
  /** wynik netto: upvotes − downvotes; od niego liczony próg wniosku */
  score: number;
  status: IssueStatus;
  /** adresy zdjęć (/api/images/…), najwyżej 4 */
  images: string[];
  authorName: string;
  createdAt: string;
  keywords: string[];
  /** głos zalogowanej osoby: 1, -1 albo 0 */
  myVote: Vote;
  commentsCount: number;
  /** autor albo urząd może usunąć */
  canDelete: boolean;
}

export type Vote = 1 | -1 | 0;

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
}

export interface Comment {
  id: string;
  issueId: string;
  authorName: string;
  authorRole: "user" | "admin";
  body: string;
  createdAt: string;
  /** autor komentarza albo urząd */
  canDelete: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: "user" | "admin";
  /** miejsce zamieszkania — domyślny filtr tablicy */
  location: Place | null;
  banned: boolean;
  banReason: string | null;
}

export interface AbuseReport {
  id: string;
  reason: string;
  createdAt: string;
  reporterName: string;
  issueId: string | null;
  issueTitle: string | null;
  commentId: string | null;
  commentBody: string | null;
  target: { id: string; displayName: string; username: string; banned: boolean } | null;
}

export interface BannedUser {
  id: string;
  username: string;
  displayName: string;
  bannedAt: string;
  reason: string | null;
}

export interface Innovation {
  id: string;
  title: string;
  sourceMunicipality: string;
  description: string;
  category: IssueCategory;
  keywords: string[];
  grantHint: string;
}

export interface PetitionDraft {
  targetDepartment: string;
  subject: string;
  bodyText: string;
  matchedInnovationId: string | null;
  matchScore: number;
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  INFRASTRUCTURE: "Infrastruktura",
  EDUCATION: "Edukacja",
  SAFETY: "Bezpieczeństwo",
  SENIORS: "Seniorzy",
  ACCESSIBILITY: "Dostępność",
  HEALTH: "Zdrowie",
  COMMUNITY: "Społeczność",
};

export const UPVOTE_THRESHOLD = 20;
