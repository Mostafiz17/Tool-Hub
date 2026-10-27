"use client";
import { Heart } from "lucide-react";
import { getTool } from "@/lib/registry";
import { useStore } from "@/lib/store";
import { EmptyState, SectionHeader, ToolCard } from "@/components/ui";

export default function FavoritesPage() {
  const { favorites, user } = useStore();
  const tools = favorites.map(getTool).filter(Boolean) as NonNullable<ReturnType<typeof getTool>>[];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 w-full space-y-8">
      <SectionHeader
        icon={<Heart size={14} />}
        eyebrow="Pinned shortcuts"
        title="Your Favorite Tools"
        desc={
          user
            ? `Synchronized to your account (${user.email}) and this device — your pins follow you everywhere.`
            : "Saved on this device. Create a free account to sync favorites across devices; all tools stay free either way."
        }
      />

      {tools.length === 0 ? (
        <EmptyState
          icon={<Heart size={22} />}
          title="No favorite tools yet"
          desc="Tap the heart on any tool card — in the catalog, categories, or a tool page — to pin it here for one-click access."
          actionHref="/tools"
          actionLabel="Find tools to pin"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      )}
    </main>
  );
}
