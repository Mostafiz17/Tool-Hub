"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck, Sparkles, Zap, LayoutGrid, FolderTree, CheckCircle2 } from "lucide-react";
import { CATEGORIES, getTool, publishedTools, toolsByCategory } from "@/lib/registry";
import { useStore } from "@/lib/store";
import { SectionHeader, ToolCard, ToolIcon } from "@/components/ui";
import { Hero } from "@/components/Hero";

export default function Home() {
  const { recent } = useStore();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const popular = publishedTools.filter((t) => t.popular);
  const featured = publishedTools.filter((t) => t.featured);
  const recentTools = recent.map(getTool).filter(Boolean).slice(0, 4) as NonNullable<ReturnType<typeof getTool>>[];
  const filteredTools = selectedCategory === "all" ? publishedTools : toolsByCategory(selectedCategory);

  return (
    <main className="w-full">
      <Hero />

      <div className="home-sections mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-16 space-y-14 sm:space-y-16">
        {/* Recently Used */}
        {recentTools.length > 0 && (
          <section aria-labelledby="recent-heading" className="space-y-6">
            <SectionHeader
              icon={<Clock size={14} />}
              eyebrow="Session history"
              title="Recently Used"
              desc="Jump straight back to the tools you opened on this device."
              actionHref="/recent"
              actionLabel="View history"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentTools.map((t) => <ToolCard key={t.slug} tool={t} />)}
            </div>
          </section>
        )}

        {/* Full catalog with instant category filtering */}
        <section aria-labelledby="catalog-heading" className="home-catalog space-y-6">
          <SectionHeader
            icon={<LayoutGrid size={14} />}
            eyebrow="Tool catalog"
            title={selectedCategory === "all" ? "Explore All Utilities" : CATEGORIES.find((c) => c.slug === selectedCategory)!.name}
            desc="Filter by category for an instant view, or open the full catalog page for sorting and deep filtering."
            actionHref="/tools"
            actionLabel="Full catalog view"
            actionVariant="button"
          />

          <div className="flex items-center gap-2 overflow-x-auto pt-1.5 pb-3 px-1 -mx-1 scrollbar-none" role="tablist" aria-label="Filter tools by category">
            <button
              role="tab"
              aria-selected={selectedCategory === "all"}
              onClick={() => setSelectedCategory("all")}
              className={`chip shrink-0 ${selectedCategory === "all" ? "chip-active" : ""}`}
            >
              <LayoutGrid size={14} />
              <span>All Tools</span>
              <CountBadge count={publishedTools.length} active={selectedCategory === "all"} />
            </button>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`chip shrink-0 ${isSelected ? "chip-active" : ""}`}
                >
                  <ToolIcon name={cat.icon} size={14} />
                  <span>{cat.name}</span>
                  <CountBadge count={toolsByCategory(cat.slug).length} active={isSelected} />
                </button>
              );
            })}
          </div>

          <p className="text-xs muted" aria-live="polite">
            Showing <strong style={{ color: "var(--text-primary)" }}>{filteredTools.length}</strong> of {publishedTools.length} tools
            {selectedCategory !== "all" && (
              <> · <button onClick={() => setSelectedCategory("all")} className="font-bold hover:underline" style={{ color: "var(--primary)" }}>show all</button></>
            )}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>

          {selectedCategory === "all" && (
            <div className="pt-2">
              <SectionHeader
                icon={<Sparkles size={14} />}
                eyebrow="Staff picks"
                title="Featured & Popular"
                desc="The tools our users reach for most, grouped for quick access."
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                {[...featured.filter((f) => !popular.includes(f)), ...popular].slice(0, 8).map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Categories directory */}
        <section aria-labelledby="categories-directory" className="space-y-6 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <SectionHeader
            icon={<FolderTree size={14} />}
            eyebrow="Tool domains"
            title="Browse Utilities by Domain"
            desc="Organized toolkits for specialized workflows — every domain lists its full tool set on a dedicated page."
            actionHref="/categories"
            actionLabel="All categories"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat) => {
              const tools = toolsByCategory(cat.slug);
              return (
                <div key={cat.slug} className="card card-hover dashboard-category-card p-5 flex flex-col">
                  <Link href={`/categories/${cat.slug}`} className="card-overlay-link" aria-label={`Open ${cat.name} category`} />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid place-items-center w-9 h-9 rounded-xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                        <ToolIcon name={cat.icon} size={17} />
                      </span>
                      <div>
                        <h3 className="card-title leading-tight">{cat.name}</h3>
                        <span className="muted-11 font-semibold">{tools.length} utilities</span>
                      </div>
                    </div>
                    <Link href={`/categories/${cat.slug}`} className="text-xs font-bold hover:text-[var(--primary)] transition-colors inline-flex items-center gap-0.5" style={{ color: "var(--primary)" }} aria-label={`View all ${cat.name} tools`}>
                      <span>View</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                  <p className="text-xs muted leading-relaxed line-clamp-2 mb-3">{cat.description}</p>
                  <ul className="space-y-1 mt-auto">
                    {tools.slice(0, 4).map((t) => (
                      <li key={t.slug}>
                        <Link href={`/tools/${t.slug}`} className="text-xs font-semibold flex items-center justify-between p-2 rounded-lg hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition-colors">
                          <span className="truncate">{t.name}</span>
                          <ArrowRight size={12} className="muted shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {tools.length > 4 && (
                    <Link href={`/categories/${cat.slug}`} className="mt-2.5 pt-2.5 border-t text-[11px] font-bold text-center block muted hover:text-[var(--primary)] transition-colors" style={{ borderColor: "var(--border)" }}>
                      + {tools.length - 4} more →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Workflow speed packs */}
        <section aria-labelledby="workflows-heading" className="space-y-6 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <SectionHeader
            icon={<Zap size={14} />}
            eyebrow="Speed packs"
            title="Curated Workflow Packs"
            desc="Common tool combinations bundled for recurring daily tasks."
          />
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: "Developer Essentials", desc: "Format JSON payloads, test regex, encode Base64, and mint v4 UUIDs without context switching.", slugs: ["json-formatter", "regex-tester", "base64", "uuid-generator"] },
              { title: "Image & Media Studio", desc: "Resize, compress, convert formats, heal small marks, and combine images into PDFs — locally.", slugs: ["image-compressor", "image-resizer", "image-converter", "watermark-remover", "images-to-pdf"] },
              { title: "Money & Calculations", desc: "Loan EMIs, live currency conversion, dinner-bill splits, and quick percentage math.", slugs: ["emi-calculator", "currency-converter", "tip-calculator", "percentage-calculator"] },
            ].map((pack) => (
              <div key={pack.title} className="card p-6 flex flex-col">
                <h3 className="card-title">{pack.title}</h3>
                <p className="text-xs muted mt-1.5 leading-relaxed">{pack.desc}</p>
                <ul className="mt-4 space-y-2">
                  {pack.slugs.map((slug) => {
                    const t = getTool(slug)!;
                    return (
                      <li key={slug}>
                        <Link href={`/tools/${slug}`} className="text-xs font-semibold flex items-center justify-between p-2.5 rounded-xl border hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors group" style={{ borderColor: "var(--border)" }}>
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="text-[var(--primary)] shrink-0"><ToolIcon name={t.icon} size={14} /></span>
                            <span className="truncate">{t.name}</span>
                          </span>
                          <ArrowRight size={13} className="muted group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy guarantee */}
        <section className="card glass-panel p-7 sm:p-9 flex flex-col sm:flex-row gap-6 items-start">
          <div className="grid place-items-center w-12 h-12 rounded-2xl shrink-0 text-white shadow-sm" style={{ background: "var(--primary)" }}>
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold tracking-tight">Privacy by Architecture</h2>
            <p className="text-sm muted mt-2 leading-relaxed max-w-3xl">
              Calculations, conversions, image edits, and cryptographic functions run directly in your browser runtime. Your files, text, and generated passwords never touch a server. Favorites and history live on your device, and only sync to your account if you create one.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5" style={{ color: "var(--success)" }}><CheckCircle2 size={14} /> Zero server file storage</span>
              <span className="inline-flex items-center gap-1.5" style={{ color: "var(--success)" }}><CheckCircle2 size={14} /> No input analytics</span>
              <span className="inline-flex items-center gap-1.5" style={{ color: "var(--success)" }}><CheckCircle2 size={14} /> No account required</span>
              <Link href="/privacy" className="underline hover:text-[var(--primary)] transition-colors ml-auto muted-13">Read privacy policy →</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
      style={{ background: active ? "rgba(255,255,255,.22)" : "var(--primary-soft)", color: active ? "#FFFFFF" : "var(--primary)" }}
    >
      {count}
    </span>
  );
}
