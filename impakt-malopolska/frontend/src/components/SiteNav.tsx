import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, House, Shield } from "lucide-react";
import { useRole } from "../lib/role-context";

export function SiteNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, setRole, isAdmin } = useRole();

  const homeActive =
    pathname === "/" || pathname.startsWith("/zgloszenie");
  const adminActive = pathname.startsWith("/admin");

  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[13px] font-bold transition ${
      active
        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
        : "border-transparent text-[var(--ink)] hover:border-[var(--ink)]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--ink)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--riso-red)] font-display text-[20px] font-black italic text-[var(--surface)] transition group-hover:rotate-6"
          >
            i
          </span>
          <span className="min-w-0 leading-none">
            <span className="block font-display text-[22px] font-black italic tracking-tight text-[var(--ink)]">
              Impakt
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
              Małopolska
            </span>
          </span>
        </Link>

        <nav aria-label="Główne" className="flex items-center gap-1">
          <Link to="/" aria-label="Tablica" className={linkClass(homeActive)}>
            <House className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Tablica</span>
          </Link>
          <Link to="/admin" aria-label="Panel urzędu" className={linkClass(adminActive)}>
            <Flame className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Panel</span>
          </Link>
        </nav>

        <div className="flex items-center rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] p-0.5">
          <button
            type="button"
            onClick={() => setRole("user")}
            className={`rounded-full px-2.5 py-1 text-[12px] font-bold transition ${
              role === "user"
                ? "bg-[var(--riso-yellow)] text-[var(--ink)]"
                : "text-[var(--muted)]"
            }`}
            aria-pressed={role === "user"}
          >
            Mieszkaniec
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("admin");
              if (!pathname.startsWith("/admin")) navigate("/admin");
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold transition ${
              isAdmin
                ? "bg-[var(--riso-blue)] text-[var(--surface)]"
                : "text-[var(--muted)]"
            }`}
            aria-pressed={isAdmin}
          >
            <Shield className="h-3 w-3" aria-hidden />
            Urząd
          </button>
        </div>
      </div>
    </header>
  );
}
