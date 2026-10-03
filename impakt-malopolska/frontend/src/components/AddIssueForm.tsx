import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Crosshair,
  ImagePlus,
  Plus,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { useIssues } from "../lib/issues-context";
import type { IssueCategory } from "../lib/types";
import { CATEGORY_LABELS } from "../lib/types";
import { LocationPickerMap } from "./LocationPickerMap";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function openForm() {
    if (!user) {
      navigate("/logowanie", { state: { from: pathname } });
      return;
    }
    setOpen(true);
  }
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
  const [submitting, setSubmitting] = useState(false);

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
    // Zdjęcie trafia do bazy jako data URL — trzymamy je małe
    if (file.size > 1_500_000) {
      setGeoError("Zdjęcie za duże (max ~1.5 MB).");
      return;
    }
    const data = await readFileAsDataUrl(file);
    setImageUrl(data);
    setGeoError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || submitting) return;
    setSubmitting(true);
    try {
      const issue = await addIssue({
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
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : "Nie udało się opublikować");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {fab ? (
        <button
          type="button"
          onClick={openForm}
          className="ink-btn group fixed bottom-6 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--riso-red)] text-[var(--surface)]"
          aria-label="Dodaj zgłoszenie" title="Zgłoś problem"
        >
          <Plus className="h-8 w-8 transition-transform duration-300 group-hover:rotate-90" strokeWidth={3} />
        </button>
      ) : (
        <button
          type="button"
          onClick={openForm}
          className="ink-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--riso-red)] px-4 py-3.5 text-[15px] font-bold text-[var(--surface)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Zgłoś problem
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1f1b16]/55 sm:items-center sm:p-4"
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
              className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border-2 border-[var(--ink)] bg-[var(--background)] shadow-[6px_6px_0_var(--shadow)] sm:rounded-[28px]"
            >
              <div className="flex items-center justify-between border-b-2 border-[var(--ink)] bg-[var(--riso-yellow)] px-5 py-4">
                <h2
                  id="add-issue-title"
                  className="font-display text-[24px] font-black italic tracking-tight text-[var(--ink)]"
                >
                  Nowa kartka
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ink-btn rounded-full bg-[var(--surface)] p-1.5 text-[var(--ink)]"
                  aria-label="Zamknij"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div>
                  <p className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]">
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
                    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--ink)]">
                      <img
                        src={imageUrl}
                        alt="Podgląd zdjęcia zgłoszenia"
                        className="h-44 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="ink-btn absolute right-3 top-3 rounded-full bg-[var(--surface)] p-1.5 text-[var(--ink)]"
                        aria-label="Usuń zdjęcie"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] transition hover:bg-[var(--wash)]"
                    >
                      <span className="flex gap-3">
                        <Camera className="h-6 w-6" />
                        <ImagePlus className="h-6 w-6" />
                      </span>
                      <span className="font-display text-[17px] font-bold italic">
                        Zrób lub wybierz zdjęcie
                      </span>
                    </button>
                  )}
                </div>

                <label className="block text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]">
                  Tytuł
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3.5 py-3 text-[17px] text-[var(--ink)] outline-none transition focus:shadow-[3px_3px_0_var(--riso-blue)]"
                    placeholder="Co jest nie tak?"
                  />
                </label>

                <label className="block text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]">
                  Opis
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 w-full resize-none rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3.5 py-3 text-[17px] text-[var(--ink)] outline-none transition focus:shadow-[3px_3px_0_var(--riso-blue)]"
                    placeholder="Komu przeszkadza i od kiedy?"
                  />
                </label>

                <label className="block text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]">
                  Kategoria
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as IssueCategory)
                    }
                    className="mt-1.5 w-full appearance-none rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3.5 py-3 text-[17px] text-[var(--ink)] outline-none transition focus:shadow-[3px_3px_0_var(--riso-blue)]"
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
                    <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]">
                      Lokalizacja
                    </p>
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={geoBusy}
                      className="ink-btn inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1 text-[13px] font-bold text-[var(--accent)] disabled:opacity-50"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      {geoBusy ? "Szukam…" : "Moja lokalizacja"}
                    </button>
                  </div>
                  <input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="mb-2 w-full rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3.5 py-3 text-[17px] text-[var(--ink)] outline-none transition focus:shadow-[3px_3px_0_var(--riso-blue)]"
                    placeholder="Nazwa miejsca"
                  />
                  <LocationPickerMap
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
                  <p className="mt-1.5 font-mono text-[12px] text-[var(--muted)]">
                    Kliknij mapę, aby ustawić pin · {lat.toFixed(4)},{" "}
                    {lng.toFixed(4)}
                  </p>
                </div>

                {geoError && (
                  <p className="rounded-xl border-2 border-[var(--ink)] bg-[#fbd3c9] px-3 py-2 text-[14px] font-semibold" role="alert">
                    {geoError}
                  </p>
                )}
              </div>

              <div className="border-t-2 border-[var(--ink)] px-5 py-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="ink-btn w-full rounded-2xl bg-[var(--riso-red)] py-3.5 text-[18px] font-extrabold text-[var(--surface)] disabled:opacity-60"
                >
                  {submitting ? "Przypinam…" : "Przypnij do tablicy"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
