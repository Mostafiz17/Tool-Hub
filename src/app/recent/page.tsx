"use client";
import { Clock, ShieldCheck, Trash2 } from "lucide-react";
import { getTool } from "@/lib/registry";
import { useStore } from "@/lib/store";
import { EmptyState, SectionHeader, ToolCard } from "@/components/ui";

export default function RecentPage() {
  const { recent, clearRecent } = useStore();
  const tools = recent.map(getTool).filter(Boolean) as NonNullable<ReturnType<typeof getTool>>[];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 w-full space-y-8">
      <div className="section-head">
        <SectionHeader
          icon={<Clock size={14} />}
          eyebrow="Activity history"
          title="Recently Used"
          desc={`Your last ${tools.length} opened tools on this browser (${tools.length}/12 kept). Only tool names are remembered — never inputs, files, or passwords.`}
        />
        {tools.length > 0 && (
          <button className="btn-ghost btn-sm self-start md:self-auto inline-flex items-center gap-1.5 shrink-0" onClick={clearRecent}>
            <Trash2 size={14} /> Clear history
          </button>
        )}
      </div>

      <p className="inline-flex items-center gap-2 text-xs muted card px-3.5 py-2.5" style={{ background: "var(--primary-soft)", borderColor: "transparent" }}>
        <ShieldCheck size={14} style={{ color: "var(--success)" }} />
        History is stored only in this browser&apos;s local storage and is never sent to a server.
      </p>

      {tools.length === 0 ? (
        <EmptyState
          icon={<Clock size={22} />}
          title="No recent activity yet"
          desc="Open any tool and it will appear here automatically for quick access — up to the 12 most recent, private to this device."
          actionHref="/tools"
          actionLabel="Explore tools"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      )}
    </main>
  );
}
