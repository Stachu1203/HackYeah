import type { Issue, Place } from "./types";

/** Odległość w km (wzór haversine). */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** „Kraków — Nowa Huta” → „Kraków” */
export function townOf(issue: Pick<Issue, "locationName">): string {
  return issue.locationName.split("—")[0]?.trim() || issue.locationName;
}

/** Bieżąca pozycja z przeglądarki (pyta o zgodę). */
export function currentPosition(): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolokalizacja niedostępna w tej przeglądarce"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          name: "Moja lokalizacja",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => reject(new Error("Nie udało się pobrać lokalizacji — zezwól w przeglądarce albo wybierz na mapie")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
