import Link from "next/link";
import type { Metadata } from "next";
import { FolderTree, ArrowRight } from "lucide-react";
import { CATEGORIES, publishedTools, toolsByCategory } from "@/lib/registry";
import { ToolIcon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Tool Categories",
  description: `Browse ${publishedTools.length} online tools organized into six specialized categories.`,
};

export default function CategoriesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 w-full space-y-8">
      <div>
        <p className="eyebrow-label"><FolderTree size={14} /><span>Tool domains</span></p>
        <h1 className="section-title">Browse by Category</h1>
        <p className="muted-13 mt-1.5 max-w-2xl leading-relaxed">
          Six focused collections covering calculations, text, developer utilities, color and design, image editing, and finance.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES.map((c) => {
          const tools = toolsByCategory(c.slug);
          return (
            <Link key={c.slug} href={`/categories/${c.slug}`} className="card card-hover p-6 block group">
              <div className="flex items-start justify-between mb-4">
                <span className="grid place-items-center w-12 h-12 rounded-2xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                  <ToolIcon name={c.icon} size={22} />
                </span>
                <span className="category-badge">{tools.length} tools</span>
              </div>
              <h2 className="card-title group-hover:text-[var(--primary)] transition-colors">{c.name}</h2>
              <p className="text-xs muted mt-1.5 leading-relaxed line-clamp-2">{c.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {tools.slice(0, 3).map((t) => (
                  <span key={t.slug} className="muted-11 px-2 py-0.5 rounded-md font-semibold" style={{ background: "var(--surface-elevated)" }}>
                    {t.name}
                  </span>
                ))}
                {tools.length > 3 && <span className="muted-11 px-2 py-0.5 rounded-md font-semibold">+{tools.length - 3} more</span>}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: "var(--border)", color: "var(--primary)" }}>
                <span>Explore category</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
