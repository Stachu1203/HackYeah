import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, Heart, House, LogIn, LogOut, Shield } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/theme";
import { LogoMark } from "./KawaiiDecor";

export function SiteNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { kawaii, toggle } = useTheme();

  const homeActive =
    pathname === "/" || pathname.startsWith("/zgloszenie");
  const adminActive = pathname.startsWith("/admin");

  const linkClass = (active: boolean) =>
    `inline-flex h-9 items-center gap-1.5 rounded-full border-2 px-2.5 text-[13px] font-bold transition sm:px-3 ${
      active
        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
        : "border-transparent text-[var(--ink)] hover:border-[var(--ink)]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--ink)] bg-[var(--background)]/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
        <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-2" aria-label="Impakt Małopolska — tablica">
          <span
            aria-hidden
            className={`flex h-9 w-9 shrink-0 -rotate-6 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--ink)] transition group-hover:rotate-6 ${
              kawaii ? "bg-[var(--riso-pink)] p-0.5" : "bg-[var(--riso-red)]"
            }`}
          >
            <LogoMark />
          </span>
          <span className="hidden min-w-0 leading-none min-[400px]:block">
            <span className="block font-display text-[21px] font-black italic tracking-tight text-[var(--ink)] sm:text-[22px]">
              Impakt
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Małopolska
            </span>
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <nav aria-label="Główne" className="flex items-center gap-1">
            <Link to="/" aria-label="Tablica" className={linkClass(homeActive)}>
              <House className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">Tablica</span>
            </Link>
            {isAdmin && (
              <Link to="/admin" aria-label="Panel urzędu" className={linkClass(adminActive)}>
                <Flame className="h-4 w-4" aria-hidden />
                <span className="hidden md:inline">Panel</span>
              </Link>
            )}
          </nav>

          <button
            type="button"
            onClick={toggle}
            aria-pressed={kawaii}
            aria-label="Kawaii mode"
            title={kawaii ? "Wyłącz kawaii mode" : "Włącz kawaii mode"}
            className={`ink-btn inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-bold ${
              kawaii ? "bg-[var(--riso-pink)]" : "bg-[var(--surface)]"
            }`}
          >
            <Heart
              className="h-4 w-4 text-[var(--riso-red)]"
              fill={kawaii ? "currentColor" : "transparent"}
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="hidden lg:inline">kawaii</span>
          </button>

          {user ? (
            <div className="flex min-w-0 items-center gap-1">
              <span
                className={`inline-flex h-9 min-w-0 items-center gap-1 rounded-full border-2 border-[var(--ink)] px-2.5 text-[12px] font-bold ${
                  isAdmin
                    ? "bg-[var(--riso-blue)] text-[var(--surface)]"
                    : "bg-[var(--riso-yellow)] text-[var(--ink)]"
                }`}
                title={`Zalogowano jako ${user.username}`}
              >
                {isAdmin && <Shield className="h-3 w-3 shrink-0" aria-hidden />}
                <span className="max-w-[4.5rem] truncate min-[400px]:max-w-[7rem] sm:max-w-[9rem]">
                  {user.displayName}
                </span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  if (pathname.startsWith("/admin")) navigate("/");
                }}
                className="ink-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]"
                aria-label="Wyloguj"
                title="Wyloguj"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <Link
              to="/logowanie"
              state={{ from: pathname }}
              className="ink-btn inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--riso-yellow)] px-3 text-[13px] font-bold"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Zaloguj
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
