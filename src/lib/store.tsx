"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type User = { id: string; name: string; email: string } | null;
type Ctx = {
  user: User; loading: boolean; login: (u: NonNullable<User>) => void; logout: () => Promise<void>;
  favorites: string[]; toggleFavorite: (slug: string) => void; isFavorite: (slug: string) => boolean;
  recent: string[]; pushRecent: (slug: string) => void; clearRecent: () => void;
  theme: string; setTheme: (t: string) => void;
};
const StoreCtx = createContext<Ctx | null>(null);

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function write(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  // Lazy initializers read on-device storage once on the client (server falls back to empty).
  const [favorites, setFavorites] = useState<string[]>(() => typeof window === "undefined" ? [] : read("toolhub:favorites", []));
  const [recent, setRecent] = useState<string[]>(() => typeof window === "undefined" ? [] : read("toolhub:recent", []));
  const [theme, setThemeState] = useState(() => typeof window === "undefined" ? "system" : read("toolhub:theme", "system"));

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then(async (d) => {
      if (d?.user) {
        setUser(d.user);
        try { const fr = await fetch("/api/favorites"); if (fr.ok) { const fd = await fr.json(); if (Array.isArray(fd.favorites)) { setFavorites(fd.favorites); write("toolhub:favorites", fd.favorites); } } } catch { /* offline */ }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply(); write("toolhub:theme", theme);
    if (theme === "system") { const mq = window.matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener("change", apply); return () => mq.removeEventListener("change", apply); }
  }, [theme]);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev].slice(0, 200);
      write("toolhub:favorites", next);
      fetch("/api/favorites", { method: prev.includes(slug) ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) }).catch(() => {});
      return next;
    });
  }, []);
  const pushRecent = useCallback((slug: string) => {
    setRecent((prev) => { const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 12); write("toolhub:recent", next); return next; });
  }, []);
  const logout = useCallback(async () => { await fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); setUser(null); }, []);

  return <StoreCtx.Provider value={{
    user, loading, login: setUser, logout,
    favorites, toggleFavorite, isFavorite: (s) => favorites.includes(s),
    recent, pushRecent, clearRecent: () => { setRecent([]); write("toolhub:recent", []); },
    theme, setTheme: setThemeState,
  }}>{children}</StoreCtx.Provider>;
}
export function useStore() { const c = useContext(StoreCtx); if (!c) throw new Error("useStore outside provider"); return c; }
