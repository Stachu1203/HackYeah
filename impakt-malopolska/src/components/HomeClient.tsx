"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, Map as MapIcon } from "lucide-react";
import { IssuesMapDynamic } from "@/components/IssuesMapDynamic";
import { IssueFeed } from "@/components/IssueFeed";
import { AddIssueForm } from "@/components/AddIssueForm";
import { useIssues } from "@/lib/issues-context";
import { UPVOTE_THRESHOLD } from "@/lib/types";

type Tab = "feed" | "map";

export function HomeClient() {
  const { issues, upvote } = useIssues();
  const [tab, setTab] = useState<Tab>("feed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handleUpvote(id: string) {
    const before = issues.find((i) => i.id === id);
    upvote(id);
    setPulseId(id);
    setTimeout(() => setPulseId(null), 450);
    const next = (before?.upvotes ?? 0) + 1;
    if (before && before.upvotes < UPVOTE_THRESHOLD && next >= UPVOTE_THRESHOLD) {
      setToast("Próg poparcia — można generować wniosek");
      setTimeout(() => setToast(null), 3200);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-4 pt-4">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
          Sąsiedzi
        </h1>
        <p className="mt-1 text-[15px] text-[var(--muted)]">
          Problemy z okolicy — poprzyj, dopasuj innowację, wyślij wniosek.
        </p>

        <div
          className="mt-4 grid grid-cols-2 rounded-xl bg-[var(--wash)] p-1"
          role="tablist"
          aria-label="Widok"
        >
          {(
            [
              { id: "feed", label: "Tablica", icon: List },
              { id: "map", label: "Mapa", icon: MapIcon },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[15px] font-semibold transition ${
                  active
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--muted)]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-5 w-full max-w-lg flex-1 px-4">
        <AnimatePresence mode="wait">
          {tab === "feed" ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <IssueFeed
                issues={issues}
                onUpvote={handleUpvote}
                pulseId={pulseId}
              />
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="pb-28"
            >
              <div className="h-[min(70vh,560px)] overflow-hidden rounded-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <IssuesMapDynamic
                  issues={issues}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  className="h-full min-h-[420px]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddIssueForm
        fab
        onCreated={(id) => {
          setSelectedId(id);
          setTab("feed");
          setToast("Opublikowano na tablicy");
          setTimeout(() => setToast(null), 2500);
        }}
      />

      {toast && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[var(--ink)]/90 px-5 py-2.5 text-[14px] font-medium text-white backdrop-blur"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
