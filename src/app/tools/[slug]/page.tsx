import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTool, publishedTools } from "@/lib/registry";
import { ToolPage } from "@/components/ToolPage";

export function generateStaticParams() { return publishedTools.map((t) => ({ slug: t.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const tool = getTool(slug);
  return tool ? { title: tool.name, description: tool.description } : { title: "Tool not found" };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const tool = getTool(slug);
  if (!tool) notFound();
  return <ToolPage tool={tool} />;
}
