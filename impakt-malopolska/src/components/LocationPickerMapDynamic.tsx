"use client";

import dynamic from "next/dynamic";

export const LocationPickerMapDynamic = dynamic(
  () => import("./LocationPickerMap").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-44 items-center justify-center rounded-2xl bg-[var(--wash)] text-sm text-[var(--muted)]">
        Mapa…
      </div>
    ),
  },
);
