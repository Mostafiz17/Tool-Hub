"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, SearchX, Sparkles, X } from "lucide-react";
import { CATEGORIES, publishedTools, searchTools } from "@/lib/registry";
import { EmptyState, SectionHeader, ToolCard, ToolIcon } from "@/components/ui";

function Catalog() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState<"all" | "featured" | "popular">("all");

  const results = useMemo(() => {
    let list = q.trim() ? searchTools(q) : publishedTools;
    if (cat !== "all") list = list.filter((t) => t.category === cat);
    if (view === "featured") list = list.filter((t) => t.featured);
    if (view === "popular") list = list.filter((t) => t.popular);
    if (sort === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "za") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    if (sort === "popular") list = [...list].sort((a, b) => Number(b.popular || b.featured || false) - Number(a.popular || a.featured || false));
    return list;
  }, [q, cat, sort, view]);

  const hasFilters = q.trim() !== "" || cat !== "all" || view !== "all";
  const resetFilters = () => { setQ(""); setCat("all"); setView("all"); };

  return (
    <main className="page-shell catalog-page mx-auto max-w-7xl px-4 sm:px-6 py-10 w-full space-y-8">
      <SectionHeader
        icon={<LayoutGrid size={14} />}
        eyebrow="Complete directory"
        title={`All ${publishedTools.length} Online Tools`}
        desc="Search, filter by category or spotlight, and sort the full library of client-side utilities. Tap the heart on any card to pin it to your favorites."
        actionHref="/categories"
        actionLabel="Browse by category"
      />

      {/* Filter toolbar */}
      <div className="card filter-panel p-4 sm:p-5 space-y-4" role="search" aria-label="Tool catalog filters">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <label htmlFor="catalog-filter" className="sr-only">Filter tools by name or keyword</label>
            <input
              id="catalog-filter"
              className="input !pl-10"
              placeholder="Filter by keyword — json, pdf, resize, math..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear filter text" className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-lg muted hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition-colors">
                <X size={15} />
              </button>
            )}
          </div>
          <select aria-label="Sort tools" className="input md:!w-56 font-semibold" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="popular">Sort: Popular & featured</option>
            <option value="az">Sort: A → Z</option>
            <option value="za">Sort: Z → A</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="muted-11 font-bold uppercase tracking-wider mr-0.5">Category:</span>
          <button className={`chip ${cat === "all" ? "chip-active" : ""}`} aria-pressed={cat === "all"} onClick={() => setCat("all")}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.slug} className={`chip ${cat === c.slug ? "chip-active" : ""}`} aria-pressed={cat === c.slug} onClick={() => setCat(c.slug)}>
              <ToolIcon name={c.icon} size={13} />
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
          <span className="muted-11 font-bold uppercase tracking-wider mr-0.5">Spotlight:</span>
          {([["all", "Everything"], ["popular", "Popular"], ["featured", "Featured"]] as const).map(([v, l]) => (
            <button key={v} className={`chip ${view === v ? "chip-active" : ""}`} aria-pressed={view === v} onClick={() => setView(v)}>
              {v === "featured" && <Sparkles size={13} />}
              {l}
            </button>
          ))}
          {hasFilters && (
            <button onClick={resetFilters} className="ml-auto text-xs font-bold inline-flex items-center gap-1 hover:underline transition-colors" style={{ color: "var(--primary)" }}>
              <X size={13} /> Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Live results count */}
      <p className="results-bar text-xs font-semibold muted -mt-2" aria-live="polite">
        Showing <strong style={{ color: "var(--text-primary)" }}>{results.length}</strong> of {publishedTools.length} tools
        {q.trim() && <> matching “<span style={{ color: "var(--primary)" }}>{q}</span>”</>}
        {cat !== "all" && <> in <span style={{ color: "var(--primary)" }}>{CATEGORIES.find((c) => c.slug === cat)?.name}</span></>}
      </p>

      {results.length === 0 ? (
        <EmptyState
          icon={<SearchX size={22} />}
          title="No tools match your filters"
          desc={<>We couldn&apos;t find anything for “{q}”{cat !== "all" ? " in this category" : ""}. Try a broader keyword like “image”, “json”, or “text”.</>}
          onAction={resetFilters}
          actionLabel="Reset all filters"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      )}

      <p className="text-xs muted text-center pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        Looking for something specific? <Link href="/categories" className="font-bold hover:underline" style={{ color: "var(--primary)" }}>Browse the six tool domains</Link> or use the search bar above.
      </p>
    </main>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-6 py-12 animate-pulse text-sm muted">Loading tools catalog…</main>}>
      <Catalog />
    </Suspense>
  );
}
