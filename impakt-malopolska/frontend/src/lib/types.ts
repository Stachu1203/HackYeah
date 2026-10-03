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
  status: IssueStatus;
  /** data URL or remote URL — photo of the problem */
  imageUrl: string | null;
  authorName: string;
  createdAt: string;
  keywords: string[];
  /** czy bieżąca przeglądarka już poparła zgłoszenie */
  voted: boolean;
  commentsCount: number;
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
