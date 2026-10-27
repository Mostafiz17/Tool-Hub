"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import * as icons from "lucide-react";
import { CATEGORIES, publishedTools, searchTools, type ToolDef } from "@/lib/registry";
import { useStore } from "@/lib/store";

export function ToolIcon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const Cmp = (icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name] || icons.Wrench;
  return <Cmp size={size} className={className} />;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="search-mark">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

/**
 * Universal Tool Search: Combobox with keyboard navigation (↑/↓/Enter/Esc),
 * live suggestions, match highlighting, and mobile responsiveness.
 */
export function SearchBox({
  autoFocus = false,
  large = false,
  placeholder,
  hero = false,
}: {
  autoFocus?: boolean;
  large?: boolean;
  placeholder?: string;
  hero?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const query = q.trim();
  const matches = query ? searchTools(query) : [];
  const results = matches.slice(0, 7);
  const showList = open && query.length > 0;
  const optionId = (i: number) => `${listId}-opt-${i}`;

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (active >= 0) {
      document.getElementById(`${listId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [active, listId]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const openTool = (slug: string) => {
    close();
    inputRef.current?.blur();
    router.push(`/tools/${slug}`);
  };

  const searchAll = () => {
    if (!query) {
      inputRef.current?.focus();
      return;
    }
    close();
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const browseAll = () => {
    close();
    router.push("/tools");
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const picked = showList && active >= 0 ? results[active] : undefined;
    if (picked) openTool(picked.slug);
    else searchAll();
  };

  const move = (dir: 1 | -1) => {
    setOpen(true);
    setActive((a) => (a < 0 ? (dir === 1 ? 0 : results.length - 1) : (a + dir + results.length) % results.length));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Escape") {
      if (showList) {
        e.preventDefault();
        close();
      } else if (q) {
        e.preventDefault();
        setQ("");
      }
    }
  };

  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={onSubmit}
      className="relative w-full"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <icons.Search
        size={hero ? 20 : 18}
        aria-hidden
        className={hero ? "search-hero-icon" : "absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 muted"}
      />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="Search tools"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        value={q}
        placeholder={placeholder ?? `Search ${publishedTools.length} tools — try “json”, “image”, “qr”...`}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={`input ${hero ? "search-hero-input" : large ? "!pl-11 !min-h-[52px] !rounded-2xl" : "!pl-10"}`}
      />
      {hero && (
        <button type="submit" className="btn-primary search-hero-btn" aria-label="Search tools">
          <span className="search-hero-btn-text">Search</span>
          <icons.ArrowRight size={17} className="search-hero-btn-icon" aria-hidden />
        </button>
      )}
      <div className="search-pop" hidden={!showList}>
        <ul id={listId} role="listbox" aria-label="Matching tools">
          {results.map((t, i) => (
            <li
              key={t.slug}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              className="search-option"
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => {
                if (i !== active) setActive(i);
              }}
              onClick={() => openTool(t.slug)}
            >
              <span className="search-option-icon">
                <ToolIcon name={t.icon} size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate">
                  <Highlight text={t.name} query={query} />
                </span>
                <span className="block text-xs muted truncate">{t.description}</span>
              </span>
              <icons.CornerDownLeft size={15} className="search-option-enter" aria-hidden />
            </li>
          ))}
        </ul>
        {results.length === 0 && (
          <p className="px-4 pt-4 pb-3 text-sm muted">
            No tools match “{query}”. Try keywords like “image”, “json”, “pdf”, or “counter”.
          </p>
        )}
        <div className="search-foot">
          <button
            type="button"
            className="search-all"
            onMouseDown={(e) => e.preventDefault()}
            onClick={results.length ? searchAll : browseAll}
          >
            {results.length ? (
              <>
                <icons.Search size={15} aria-hidden />
                <span className="truncate">See all {matches.length} result{matches.length === 1 ? "" : "s"} for “{query}”</span>
              </>
            ) : (
              <>
                <icons.LayoutGrid size={15} aria-hidden />
                <span>Browse all {publishedTools.length} tools</span>
              </>
            )}
            <icons.ArrowRight size={14} className="ml-auto shrink-0" aria-hidden />
          </button>
          <span className="search-keys" aria-hidden>
            <kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>↵</kbd> select <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </form>
  );
}

const NAV_LINKS: [string, string][] = [["/tools", "All Tools"], ["/categories", "Categories"], ["/favorites", "Favorites"], ["/recent", "Recent"]];

export function Header() {
  const { user, logout, theme, setTheme, favorites } = useStore();
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b glass-panel" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-4 h-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight shrink-0 group" aria-label="ToolHub home">
            <span className="grid place-items-center w-9 h-9 rounded-xl text-white shadow-sm" style={{ background: "var(--primary)" }}>
              <icons.Wrench size={18} className="transition-transform group-hover:rotate-12" />
            </span>
            <span className="font-extrabold tracking-tight">
              Tool<span style={{ color: "var(--primary)" }}>Hub</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold" aria-label="Primary navigation">
            {NAV_LINKS.map(([href, label]) => {
              const active = pathname === href || (href === "/tools" ? pathname.startsWith("/tools") : pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 ${active ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"}`}
                >
                  {label}
                  {href === "/favorites" && favorites.length > 0 && (
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--primary)", color: "#FFFFFF" }}>
                      {favorites.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:block flex-1 max-w-sm mx-2">
          <SearchBox placeholder="Search tools..." />
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-ghost btn-sm !px-2.5 rounded-xl"
            aria-label="Toggle theme"
            title="Toggle theme (Light / Dark / System)"
            onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")}
          >
            {theme === "dark" ? <icons.Moon size={17} /> : theme === "light" ? <icons.Sun size={17} /> : <icons.Monitor size={17} />}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-semibold hidden xl:block px-2">
                {user.name.split(" ")[0]}
              </span>
              <button className="btn-ghost btn-sm" onClick={logout}>
                <icons.LogOut size={15} /> Log out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link className="btn-ghost btn-sm" href="/login">
                Log in
              </Link>
              <Link className="btn-primary btn-sm" href="/register">
                Sign up
              </Link>
            </div>
          )}

          <button
            className="btn-ghost btn-sm !px-2.5 lg:hidden rounded-xl"
            aria-label="Toggle navigation menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <icons.X size={19} /> : <icons.Menu size={19} />}
          </button>
        </div>
      </div>

      {menu && (
        <nav className="lg:hidden border-t px-4 py-4 flex flex-col gap-1.5 glass-panel" style={{ borderColor: "var(--border)" }} aria-label="Mobile Navigation">
          <div className="md:hidden mb-2">
            <SearchBox placeholder={`Search ${publishedTools.length} tools...`} />
          </div>
          {[
            ["/tools", "All Tools", icons.LayoutGrid],
            ["/categories", "Categories", icons.FolderTree],
            ["/favorites", `Favorites (${favorites.length})`, icons.Heart],
            ["/recent", "Recently Used", icons.Clock],
            ["/login", "Log In", icons.LogIn],
            ["/register", "Sign Up Free", icons.UserPlus],
          ].map(([href, label, Icon]) => {
            const IconCmp = Icon as React.ComponentType<{ size: number; className?: string }>;
            return (
              <Link
                key={href as string}
                href={href as string}
                onClick={() => setMenu(false)}
                className="px-3.5 py-3 rounded-xl font-semibold hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] min-h-[44px] flex items-center gap-3 transition-colors"
              >
                <IconCmp size={18} className="muted" />
                <span>{label as string}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t mt-24" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight" aria-label="ToolHub home">
            <span className="grid place-items-center w-8 h-8 rounded-lg text-white" style={{ background: "var(--primary)" }}>
              <icons.Wrench size={16} />
            </span>
            <span>Tool<span style={{ color: "var(--primary)" }}>Hub</span></span>
          </Link>
          <p className="text-sm muted mt-3.5 leading-relaxed">
            A growing library of {publishedTools.length} free online tools for everyday tasks. Most processing stays in your browser.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--success)" }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--success)" }} />
            <span>100% Client-Side & Private</span>
          </div>
        </div>

        <nav aria-label="Categories">
          <p className="font-bold text-sm mb-3.5 tracking-tight">Categories</p>
          <ul className="space-y-2.5 text-sm muted">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link className="hover:text-[var(--primary)] transition-colors" href={`/categories/${c.slug}`}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Popular tools">
          <p className="font-bold text-sm mb-3.5 tracking-tight">Popular Tools</p>
          <ul className="space-y-2.5 text-sm muted">
            {publishedTools.filter((t) => t.popular).slice(0, 6).map((t) => (
              <li key={t.slug}>
                <Link className="hover:text-[var(--primary)] transition-colors" href={`/tools/${t.slug}`}>
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Platform and legal">
          <p className="font-bold text-sm mb-3.5 tracking-tight">ToolHub</p>
          <ul className="space-y-2.5 text-sm muted">
            <li><Link className="hover:text-[var(--primary)] transition-colors" href="/tools">All {publishedTools.length} Tools</Link></li>
            <li><Link className="hover:text-[var(--primary)] transition-colors" href="/favorites">Favorites</Link></li>
            <li><Link className="hover:text-[var(--primary)] transition-colors" href="/recent">Recently Used</Link></li>
            <li><Link className="hover:text-[var(--primary)] transition-colors" href="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-[var(--primary)] transition-colors" href="/terms">Terms of Use</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t py-6 text-center text-xs muted px-4 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto" style={{ borderColor: "var(--border)" }}>
        <p>© {new Date().getFullYear()} ToolHub. Inspired by TinyWow & 10015.io. Free and open utility platform.</p>
        <p className="mt-2 sm:mt-0 font-medium">All processing happens locally in your browser.</p>
      </div>
    </footer>
  );
}

/**
 * Enhanced ToolCard (inspired by 10015.io & TinyWow):
 * Compact, scannable, category pill, favorite heart, and smooth hover elevation.
 */
export function ToolCard({ tool }: { tool: ToolDef }) {
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(tool.slug);
  const cat = CATEGORIES.find((c) => c.slug === tool.category);

  return (
    <div className="tool-card group">
      <div className="flex items-start justify-between gap-2">
        <div className="tool-card-icon">
          <ToolIcon name={tool.icon} size={20} />
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(tool.slug);
          }}
          aria-label={fav ? `Remove ${tool.name} from favorites` : `Save ${tool.name} to favorites`}
          aria-pressed={fav}
          className="fav-btn relative z-[1] grid place-items-center w-9 h-9 rounded-xl hover:bg-[var(--primary-soft)] transition-colors"
          style={{ color: fav ? "#EF4444" : "var(--text-muted)" }}
        >
          <icons.Heart size={18} fill={fav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex-1">
        <Link href={`/tools/${tool.slug}`} className="stretched font-bold hover:text-[var(--primary)] block transition-colors">
          <h3 className="card-title leading-snug group-hover:text-[var(--primary)] transition-colors">
            {tool.name}
          </h3>
        </Link>
        <p className="text-xs muted mt-1.5 leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t mt-auto text-xs" style={{ borderColor: "var(--border)" }}>
        <span className="category-badge">
          {cat?.name.split(" ")[0]}
        </span>
        <span className="font-semibold text-xs inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--primary)" }}>
          Open <icons.ArrowUpRight size={13} />
        </span>
      </div>
    </div>
  );
}

/**
 * Shared section header: consistent eyebrow → title → description rhythm
 * with an optional action link, used across home, catalog, search, etc.
 */
export function SectionHeader({
  eyebrow,
  icon,
  title,
  desc,
  actionHref,
  actionLabel,
  actionVariant = "link",
}: {
  eyebrow?: string;
  icon?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  actionVariant?: "link" | "button";
}) {
  return (
    <div className="section-head">
      <div className="min-w-0">
        {eyebrow && (
          <p className="eyebrow-label">
            {icon}
            <span>{eyebrow}</span>
          </p>
        )}
        <h2 className="section-title">{title}</h2>
        {desc && <p className="muted-13 mt-1.5 max-w-2xl leading-relaxed">{desc}</p>}
      </div>
      {actionHref && actionLabel && (
        actionVariant === "button" ? (
          <Link href={actionHref} className="btn-ghost btn-sm self-start md:self-auto inline-flex items-center gap-1.5 shrink-0">
            <span>{actionLabel}</span>
            <icons.ArrowRight size={14} />
          </Link>
        ) : (
          <Link href={actionHref} className="text-sm font-semibold flex items-center gap-1 hover:text-[var(--primary)] transition-colors self-start md:self-auto shrink-0" style={{ color: "var(--primary)" }}>
            <span>{actionLabel}</span>
            <icons.ArrowRight size={14} />
          </Link>
        )
      )}
    </div>
  );
}

/** Shared empty / no-results state with an always-actionable next step. */
export function EmptyState({
  icon,
  title,
  desc,
  actionHref,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  desc: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="card empty-state">
      <div className="empty-state-icon" aria-hidden>{icon}</div>
      <h2 className="empty-state-title">{title}</h2>
      <p className="text-xs muted leading-relaxed">{desc}</p>
      {actionHref && (
        <Link href={actionHref} className="btn-primary btn-sm mt-2 inline-flex items-center gap-1.5">
          {actionLabel ?? "Continue"}
          <icons.ArrowRight size={14} />
        </Link>
      )}
      {onAction && !actionHref && (
        <button className="btn-primary btn-sm mt-2" onClick={onAction}>{actionLabel ?? "Clear filters"}</button>
      )}
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn-ghost btn-sm"
      disabled={!text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? (
        <>
          <icons.Check size={15} className="text-green-500" /> Copied
        </>
      ) : (
        <>
          <icons.Copy size={15} /> {label}
        </>
      )}
    </button>
  );
}

export function DownloadButton({ href, filename, label = "Download" }: { href: string; filename: string; label?: string }) {
  return (
    <a className="btn-primary btn-sm" href={href} download={filename}>
      <icons.Download size={15} /> {label}
    </a>
  );
}

export function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p
      role="alert"
      className="flex gap-2.5 items-start text-sm font-medium rounded-xl px-4 py-3 border"
      style={{
        color: "var(--error)",
        borderColor: "color-mix(in srgb, var(--error) 40%, transparent)",
        background: "var(--error-soft)",
      }}
    >
      <icons.AlertCircle size={17} className="shrink-0 mt-0.5" />
      <span>{msg}</span>
    </p>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="text-[11px] font-bold uppercase tracking-wider muted block mb-0.5">{label}</span>
      <b>{value}</b>
    </div>
  );
}
