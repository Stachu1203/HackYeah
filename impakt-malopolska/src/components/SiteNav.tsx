"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flame, House, Shield } from "lucide-react";
import { useRole } from "@/lib/role-context";

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole, isAdmin } = useRole();

  const homeActive =
    pathname === "/" || pathname.startsWith("/zgloszenie");
  const adminActive = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[var(--surface)]/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="min-w-0">
          <span className="block text-[17px] font-bold tracking-tight text-[var(--ink)]">
            Impakt
          </span>
          <span className="block text-[11px] font-medium text-[var(--muted)]">
            Małopolska
          </span>
        </Link>

        <nav aria-label="Główne" className="flex items-center gap-1">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition ${
              homeActive
                ? "bg-[var(--wash)] text-[var(--ink)]"
                : "text-[var(--muted)]"
            }`}
          >
            <House className="h-4 w-4" aria-hidden />
            <span className="hidden xs:inline sm:inline">Start</span>
          </Link>
          <Link
            href="/admin"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition ${
              adminActive
                ? "bg-[var(--wash)] text-[var(--ink)]"
                : "text-[var(--muted)]"
            }`}
          >
            <Flame className="h-4 w-4" aria-hidden />
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-1 rounded-full bg-[var(--wash)] p-0.5">
          <button
            type="button"
            onClick={() => setRole("user")}
            className={`rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition ${
              role === "user"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
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
              if (!pathname.startsWith("/admin")) router.push("/admin");
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition ${
              isAdmin
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
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
