import { NextResponse } from "next/server";
import { findBestMatches } from "@/lib/match";
import { SEED_ISSUES } from "@/lib/seed";
import type { Issue } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { issue?: Issue; issueId?: string };
  const issue =
    body.issue ??
    SEED_ISSUES.find((i) => i.id === body.issueId);

  if (!issue) {
    return NextResponse.json({ error: "Brak zgłoszenia" }, { status: 400 });
  }

  const matches = findBestMatches(issue, 3).map(({ innovation, score }) => ({
    score,
    innovation,
  }));

  return NextResponse.json({ matches, best: matches[0] ?? null });
}
