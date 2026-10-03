import type { Innovation, Issue } from "./types";
import { SEED_INNOVATIONS } from "./seed";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9ąćęłńóśźż]+/i)
    .filter((t) => t.length > 2);
}

export function scoreMatch(issue: Issue, innovation: Innovation): number {
  const issueTokens = new Set([
    ...issue.keywords.map((k) => k.toLowerCase()),
    ...tokenize(issue.title),
    ...tokenize(issue.description),
  ]);

  const innTokens = [
    ...innovation.keywords.map((k) => k.toLowerCase()),
    ...tokenize(innovation.title),
    ...tokenize(innovation.description),
  ];

  let hits = 0;
  for (const token of innTokens) {
    if (issueTokens.has(token)) hits += 1;
  }

  const categoryBonus = issue.category === innovation.category ? 3 : 0;
  return hits + categoryBonus;
}

export function findBestMatches(
  issue: Issue,
  limit = 3,
): Array<{ innovation: Innovation; score: number }> {
  return SEED_INNOVATIONS.map((innovation) => ({
    innovation,
    score: scoreMatch(issue, innovation),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .filter((m) => m.score > 0);
}

export function getInnovationById(id: string): Innovation | undefined {
  return SEED_INNOVATIONS.find((i) => i.id === id);
}
