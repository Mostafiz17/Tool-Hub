import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { CATEGORIES, getCategory, publishedTools, toolsByCategory } from "@/lib/registry";
import { ToolCard, ToolIcon } from "@/components/ui";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCategory(slug);
  return c ? { title: `${c.name} — ToolHub`, description: c.description } : { title: "Category not found" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const tools = toolsByCategory(slug);
  const others = CATEGORIES.filter((c) => c.slug !== slug);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 w-full space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold muted">
        <Link href="/" className="hover:text-[var(--primary)] transition-colors">Home</Link>
        <ChevronRight size={13} />
        <Link href="/categories" className="hover:text-[var(--primary)] transition-colors">Categories</Link>
        <ChevronRight size={13} />
        <span aria-current="page" style={{ color: "var(--text-primary)" }}>{cat.name}</span>
      </nav>

      {/* Category header */}
      <div className="flex items-start gap-4">
        <span className="grid place-items-center w-13 h-13 p-3.5 rounded-2xl shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
          <ToolIcon name={cat.icon} size={24} />
        </span>
        <div>
          <p className="eyebrow-label"><span>{tools.length} utilities</span></p>
          <h1 className="section-title">{cat.name}</h1>
          <p className="muted-13 mt-1 max-w-2xl leading-relaxed">{cat.description}</p>
        </div>
      </div>

      {/* Tools grid */}
      <section aria-labelledby="cat-tools" className="space-y-5">
        <h2 id="cat-tools" className="sr-only">{cat.name} tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      </section>

      {/* Switch category */}
      <div className="pt-8 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
        <p className="muted-11 font-bold uppercase tracking-wider">Explore other domains:</p>
        <div className="flex flex-wrap gap-2">
          {others.map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}`} className="chip">
              <ToolIcon name={c.icon} size={14} />
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-xs font-bold mt-2 hover:underline" style={{ color: "var(--primary)" }}>
          <ArrowLeft size={13} /> Or view all {publishedTools.length} tools in the full catalog
        </Link>
      </div>
    </main>
  );
}
