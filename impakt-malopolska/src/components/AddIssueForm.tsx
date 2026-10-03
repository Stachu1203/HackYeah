"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Crosshair,
  ImagePlus,
  Plus,
  X,
} from "lucide-react";
import { useIssues } from "@/lib/issues-context";
import type { IssueCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { LocationPickerMapDynamic } from "@/components/LocationPickerMapDynamic";

const DEFAULT_LAT = 50.0614;
const DEFAULT_LNG = 19.9366;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AddIssueForm({
  onCreated,
  fab = false,
}: {
  onCreated?: (id: string) => void;
  fab?: boolean;
}) {
  const { addIssue } = useIssues();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("INFRASTRUCTURE");
  const [locationName, setLocationName] = useState("Kraków");
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("INFRASTRUCTURE");
    setLocationName("Kraków");
    setLat(DEFAULT_LAT);
    setLng(DEFAULT_LNG);
    setImageUrl(null);
    setGeoError(null);
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolokalizacja niedostępna w tej przeglądarce.");
      return;
    }
    setGeoBusy(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationName("Moja lokalizacja");
        setGeoBusy(false);
      },
      () => {
        setGeoError("Nie udało się pobrać lokalizacji — kliknij mapę.");
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function onPhotoChange(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setGeoError("Wybierz plik obrazu.");
      return;
    }
    // Keep storage small for localStorage
    if (file.size > 1_500_000) {
      setGeoError("Zdjęcie za duże (max ~1.5 MB).");
      return;
    }
    const data = await readFileAsDataUrl(file);
    setImageUrl(data);
    setGeoError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const issue = addIssue({
      title: title.trim(),
      description: description.trim(),
      category,
      latitude: lat,
      longitude: lng,
      locationName: locationName.trim() || "Małopolska",
      imageUrl,
    });
    resetForm();
    setOpen(false);
    onCreated?.(issue.id);
  }

  return (
    <div>
      {fab ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-black/15 transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-label="Dodaj zgłoszenie"
        >
          <Plus className="h-7 w-7" strokeWidth={2.25} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Zgłoś problem
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-issue-title"
          >
            <motion.form
              onSubmit={submit}
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-[var(--surface)] shadow-2xl sm:rounded-[28px]"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
                <h2
                  id="add-issue-title"
                  className="text-[17px] font-semibold tracking-tight text-[var(--ink)]"
                >
                  Nowe zgłoszenie
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[var(--wash)] p-2 text-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  aria-label="Zamknij"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div>
                  <p className="mb-2 text-[13px] font-medium text-[var(--muted)]">
                    Zdjęcie
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => onPhotoChange(e.target.files?.[0])}
                  />
                  {imageUrl ? (
                    <div className="relative overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Podgląd zdjęcia zgłoszenia"
                        className="h-44 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white"
                        aria-label="Usuń zdjęcie"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--wash)] text-[var(--muted)] transition active:bg-[var(--line)]"
                    >
                      <span className="flex gap-3">
                        <Camera className="h-6 w-6" />
                        <ImagePlus className="h-6 w-6" />
                      </span>
                      <span className="text-[15px] font-medium">
                        Zrób lub wybierz zdjęcie
                      </span>
                    </button>
                  )}
                </div>

                <label className="block text-[13px] font-medium text-[var(--muted)]">
                  Tytuł
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border-0 bg-[var(--wash)] px-3.5 py-3 text-[17px] text-[var(--ink)] outline-none ring-0 focus:ring-2 focus:ring-[var(--accent)]/40"
                    placeholder="Co jest nie tak?"
                  />
                </label>

                <label className="block text-[13px] font-medium text-[var(--muted)]">
                  Opis
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 w-full resize-none rounded-xl border-0 bg-[var(--wash)] px-3.5 py-3 text-[17px] text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                    placeholder="Komu przeszkadza i od kiedy?"
                  />
                </label>

                <label className="block text-[13px] font-medium text-[var(--muted)]">
                  Kategoria
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as IssueCategory)
                    }
                    className="mt-1.5 w-full appearance-none rounded-xl border-0 bg-[var(--wash)] px-3.5 py-3 text-[17px] text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                  >
                    {(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {CATEGORY_LABELS[key]}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-[var(--muted)]">
                      Lokalizacja
                    </p>
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={geoBusy}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--wash)] px-3 py-1.5 text-[13px] font-semibold text-[var(--accent)] disabled:opacity-50"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      {geoBusy ? "Szukam…" : "Moja lokalizacja"}
                    </button>
                  </div>
                  <input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="mb-2 w-full rounded-xl border-0 bg-[var(--wash)] px-3.5 py-3 text-[17px] text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                    placeholder="Nazwa miejsca"
                  />
                  <LocationPickerMapDynamic
                    lat={lat}
                    lng={lng}
                    onPick={(a, b) => {
                      setLat(a);
                      setLng(b);
                      setLocationName((prev) =>
                        prev === "Moja lokalizacja" || prev === "Kraków"
                          ? "Wybrane na mapie"
                          : prev,
                      );
                    }}
                  />
                  <p className="mt-1.5 text-[12px] text-[var(--muted)]">
                    Kliknij mapę, aby ustawić pin · {lat.toFixed(4)},{" "}
                    {lng.toFixed(4)}
                  </p>
                </div>

                {geoError && (
                  <p className="text-[13px] text-red-600" role="alert">
                    {geoError}
                  </p>
                )}
              </div>

              <div className="border-t border-[var(--line)] px-5 py-4">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[var(--accent)] py-3.5 text-[17px] font-semibold text-white transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Opublikuj
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
