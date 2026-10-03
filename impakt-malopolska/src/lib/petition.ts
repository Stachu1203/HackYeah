import type { Innovation, Issue, PetitionDraft } from "./types";
import { CATEGORY_LABELS } from "./types";

const OFFICE_BY_CATEGORY: Record<string, string> = {
  INFRASTRUCTURE: "Zarząd Dróg / Wydział Infrastruktury",
  EDUCATION: "Wydział Edukacji",
  SAFETY: "Wydział Bezpieczeństwa i Zarządzania Kryzysowego",
  SENIORS: "Centrum Usług Społecznych / Wydział Polityki Społecznej",
  ACCESSIBILITY: "Pełnomocnik ds. dostępności / Wydział Infrastruktury",
  HEALTH: "Wydział Zdrowia",
  COMMUNITY: "Wydział Spraw Społecznych / CUS",
};

/** Deterministyczny generator wniosku (demo bez klucza API). */
export function draftPetition(
  issue: Issue,
  innovation: Innovation | null,
  matchScore = 0,
): PetitionDraft {
  const municipality = issue.locationName.split("—")[0]?.trim() ?? issue.locationName;
  const dept =
    OFFICE_BY_CATEGORY[issue.category] ?? "Urząd Gminy / Miasta — kancelaria";

  const innovationBlock = innovation
    ? `\n\nW podobnej sprawie gmina ${innovation.sourceMunicipality} wdrożyła rozwiązanie „${innovation.title}”: ${innovation.description} Proponujemy rozważyć analogiczne działanie. Źródło finansowania (wskazówka): ${innovation.grantHint}.`
    : "";

  const bodyText = `Szanowni Państwo,

Działając na podstawie art. 241 Kodeksu postępowania administracyjnego, w imieniu lokalnej społeczności (${issue.upvotes} osób poparło zgłoszenie) składamy wniosek w sprawie:

${issue.title}

Opis problemu:
${issue.description}

Lokalizacja: ${issue.locationName}
Kategoria: ${CATEGORY_LABELS[issue.category]}
${innovationBlock}

Prosimy o:
1) potwierdzenie przyjęcia wniosku,
2) wskazanie jednostki właściwej do załatwienia sprawy,
3) informację o planowanych działaniach i terminie odpowiedzi.

Z poważaniem,
Mieszkańcy — ${municipality}
(wygenerowano w systemie ImpaktMałopolska — demo HackYeah)`;

  return {
    targetDepartment: `${dept} — ${municipality}`,
    subject: `Wniosek obywatelski (art. 241 KPA): ${issue.title} — poparcie ${issue.upvotes} mieszkańców`,
    bodyText,
    matchedInnovationId: innovation?.id ?? null,
    matchScore,
  };
}
