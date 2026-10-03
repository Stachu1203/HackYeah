"use client";

import dynamic from "next/dynamic";

export const IssuesMapDynamic = dynamic(
  () => import("./IssuesMap").then((m) => m.IssuesMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[320px] h-full items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--wash)] text-[var(--muted)]"
        role="status"
      >
        Ładowanie mapy…
      </div>
    ),
  },
);
