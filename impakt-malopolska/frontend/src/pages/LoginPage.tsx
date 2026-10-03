import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../lib/auth-context";

type Mode = "login" | "register";

const FIELD =
  "mt-1.5 w-full rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3.5 py-3 text-[17px] text-[var(--ink)] outline-none transition focus:shadow-[3px_3px_0_var(--riso-blue)]";
const LABEL =
  "block text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]";

export function LoginPage() {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const u =
        mode === "login"
          ? await login(username.trim(), password)
          : await register({
              username: username.trim(),
              password,
              displayName: displayName.trim() || undefined,
            });
      navigate(u.role === "admin" && from === "/" ? "/admin" : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coś poszło nie tak");
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-14">
        <div className="paper-card p-8 text-center">
          <span className="tape" aria-hidden />
          <p className="font-display text-[28px] font-black italic">Cześć, {user.displayName}!</p>
          <p className="mt-2 text-[15px] text-[var(--muted)]">
            Jesteś zalogowany jako <strong>{user.username}</strong>
            {user.role === "admin" ? " (urząd)" : ""}.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={user.role === "admin" ? "/admin" : "/"}
              className="ink-btn rounded-full bg-[var(--riso-yellow)] px-5 py-2 font-bold"
            >
              {user.role === "admin" ? "Panel urzędu" : "Na tablicę"}
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="ink-btn rounded-full bg-[var(--surface)] px-5 py-2 font-bold"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-10">
      <p className="mb-2 inline-block -rotate-2 rounded-md border-2 border-[var(--ink)] bg-[var(--riso-pink)] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.18em]">
        Konto mieszkańca
      </p>
      <h1 className="font-display text-[44px] font-black italic leading-none tracking-tight">
        <span className="squiggle">{isLogin ? "Zaloguj się" : "Załóż konto"}</span>
      </h1>
      <p className="mt-4 text-[15px] text-[var(--ink)]/75">
        Konto pozwala dodawać zgłoszenia i popierać je — jeden głos na osobę.
      </p>

      <div
        className="mt-6 grid grid-cols-2 gap-1 rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] p-1"
        role="tablist"
        aria-label="Logowanie lub rejestracja"
      >
        {(
          [
            ["login", "Logowanie", LogIn],
            ["register", "Rejestracja", UserPlus],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              setError(null);
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-[15px] font-bold transition ${
              mode === id
                ? "bg-[var(--ink)] text-[var(--surface)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <motion.form
        key={mode}
        onSubmit={submit}
        initial={{ opacity: 0, y: 10, rotate: 0.8 }}
        animate={{ opacity: 1, y: 0, rotate: -0.4 }}
        className="paper-card mt-8 space-y-4 p-5"
      >
        <span className="tape" aria-hidden />
        <label className={LABEL}>
          Login
          <input
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={FIELD}
            minLength={isLogin ? undefined : 3}
            maxLength={32}
          />
        </label>
        {!isLogin && (
          <label className={LABEL}>
            Podpis na tablicy (opcjonalnie)
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={FIELD}
              maxLength={60}
              placeholder="np. Anna K."
            />
          </label>
        )}
        <label className={LABEL}>
          Hasło
          <input
            required
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={FIELD}
            minLength={isLogin ? undefined : 8}
          />
        </label>
        {!isLogin && (
          <p className="text-[13px] text-[var(--muted)]">
            Login: 3–32 znaki (litery, cyfry, _ . -). Hasło: co najmniej 8 znaków.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border-2 border-[var(--ink)] bg-[#fbd3c9] px-3 py-2 text-[14px] font-semibold"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="ink-btn w-full rounded-2xl bg-[var(--riso-red)] py-3.5 text-[18px] font-extrabold text-[var(--surface)] disabled:opacity-60"
        >
          {busy ? "Chwileczkę…" : isLogin ? "Zaloguj" : "Załóż konto"}
        </button>
      </motion.form>
    </div>
  );
}
