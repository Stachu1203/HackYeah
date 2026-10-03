import { NextResponse } from "next/server";
import { findBestMatches, getInnovationById } from "@/lib/match";
import { draftPetition } from "@/lib/petition";
import { SEED_ISSUES } from "@/lib/seed";
import type { Issue } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    issue?: Issue;
    issueId?: string;
    innovationId?: string;
  };

  const issue =
    body.issue ?? SEED_ISSUES.find((i) => i.id === body.issueId);

  if (!issue) {
    return NextResponse.json({ error: "Brak zgłoszenia" }, { status: 400 });
  }

  const matches = findBestMatches(issue, 1);
  const best = matches[0];
  const innovation =
    (body.innovationId
      ? getInnovationById(body.innovationId)
      : best?.innovation) ?? null;

  const petition = draftPetition(issue, innovation, best?.score ?? 0);

  return NextResponse.json({
    petition,
    innovation,
    demoNote:
      "Wniosek wygenerowany lokalnie (szablon + matchmaking). Na demo „Wyślij” otwiera mailto — bez ePUAP.",
  });
}
