"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { publishedTools, searchTools } from "@/lib/registry";
import { EmptyState, SectionHeader, ToolCard } from "@/components/ui";

function Results() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const results = q ? searchTools(q) : publishedTools;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 w-full space-y-8">
      <SectionHeader
        icon={<Search size={14} />}
        eyebrow="Search results"
        title={q ? <>Results for “<span style={{ color: "var(--primary)" }}>{q}</span>”</> : "Search all tools"}
        desc={
          q
            ? `${results.length} tool${results.length === 1 ? "" : "s"} matched your query. Refine your search below — suggestions appear as you type.`
            : "Type a keyword to search across tool names, descriptions, and keywords."
        }
      />

      {results.length === 0 ? (
        <EmptyState
          icon={<SearchX size={22} />}
          title={`Nothing matches “${q}”`}
          desc="Check the spelling, or try a broader single keyword like “image”, “json”, “percent”, or “qr”. Every tool is also listed in the full catalog."
          actionHref="/tools"
          actionLabel="Browse all tools"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-6 py-12 animate-pulse text-sm muted">Searching tools…</main>}>
      <Results />
    </Suspense>
  );
}
