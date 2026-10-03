"""Deterministyczny generator wniosku z art. 241 KPA (demo bez klucza API)."""

CATEGORY_LABELS = {
    "INFRASTRUCTURE": "Infrastruktura",
    "EDUCATION": "Edukacja",
    "SAFETY": "Bezpieczeństwo",
    "SENIORS": "Seniorzy",
    "ACCESSIBILITY": "Dostępność",
    "HEALTH": "Zdrowie",
    "COMMUNITY": "Społeczność",
}

OFFICE_BY_CATEGORY = {
    "INFRASTRUCTURE": "Zarząd Dróg / Wydział Infrastruktury",
    "EDUCATION": "Wydział Edukacji",
    "SAFETY": "Wydział Bezpieczeństwa i Zarządzania Kryzysowego",
    "SENIORS": "Centrum Usług Społecznych / Wydział Polityki Społecznej",
    "ACCESSIBILITY": "Pełnomocnik ds. dostępności / Wydział Infrastruktury",
    "HEALTH": "Wydział Zdrowia",
    "COMMUNITY": "Wydział Spraw Społecznych / CUS",
}


def draft_petition(issue: dict, innovation: dict | None, match_score: int = 0) -> dict:
    municipality = issue["locationName"].split("—")[0].strip() or issue["locationName"]
    dept = OFFICE_BY_CATEGORY.get(issue["category"], "Urząd Gminy / Miasta — kancelaria")

    innovation_block = ""
    if innovation:
        innovation_block = (
            f"\n\nW podobnej sprawie gmina {innovation['sourceMunicipality']} wdrożyła "
            f"rozwiązanie „{innovation['title']}”: {innovation['description']} "
            f"Proponujemy rozważyć analogiczne działanie. Źródło finansowania (wskazówka): "
            f"{innovation['grantHint']}."
        )

    body = f"""Szanowni Państwo,

Działając na podstawie art. 241 Kodeksu postępowania administracyjnego, w imieniu lokalnej społeczności ({issue['upvotes']} osób poparło zgłoszenie) składamy wniosek w sprawie:

{issue['title']}

Opis problemu:
{issue['description']}

Lokalizacja: {issue['locationName']}
Kategoria: {CATEGORY_LABELS.get(issue['category'], issue['category'])}
{innovation_block}

Prosimy o:
1) potwierdzenie przyjęcia wniosku,
2) wskazanie jednostki właściwej do załatwienia sprawy,
3) informację o planowanych działaniach i terminie odpowiedzi.

Z poważaniem,
Mieszkańcy — {municipality}
(wygenerowano w systemie ImpaktMałopolska — demo HackYeah)"""

    return {
        "targetDepartment": f"{dept} — {municipality}",
        "subject": (
            f"Wniosek obywatelski (art. 241 KPA): {issue['title']} — "
            f"poparcie {issue['upvotes']} mieszkańców"
        ),
        "bodyText": body,
        "matchedInnovationId": innovation["id"] if innovation else None,
        "matchScore": match_score,
    }
