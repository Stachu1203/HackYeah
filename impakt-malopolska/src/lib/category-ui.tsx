import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  HeartPulse,
  Lightbulb,
  School,
  Users,
  Wrench,
} from "lucide-react";
import type { IssueCategory } from "./types";
import { CATEGORY_COLORS } from "./placeholders";

export { CATEGORY_COLORS };

export const CATEGORY_ICONS: Record<IssueCategory, LucideIcon> = {
  INFRASTRUCTURE: Wrench,
  EDUCATION: School,
  SAFETY: Lightbulb,
  SENIORS: Users,
  ACCESSIBILITY: Accessibility,
  HEALTH: HeartPulse,
  COMMUNITY: Users,
};
