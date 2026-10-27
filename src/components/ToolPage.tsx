"use client";
import Link from "next/link";
import { useEffect } from "react";
import { ChevronRight, Heart, ShieldCheck, Globe2 } from "lucide-react";
import { getCategory, publishedTools, type ToolDef } from "@/lib/registry";
import { useStore } from "@/lib/store";
import { SectionHeader, ToolCard, ToolIcon } from "./ui";
import { AgeTool, CalculatorTool, CountdownTool, DateDiffTool, PercentageTool, UnitConverterTool } from "./tools-calc";
import { CaseConverterTool, LoremTool, TextDiffTool, WhitespaceTool, WordCounterTool } from "./tools-text";
import { Base64Tool, ColorConverterTool, JsonTool, PasswordGeneratorTool, PasswordStrengthTool, RegexTool, UrlTool, UuidTool } from "./tools-dev";
import { ColorPickerTool, FontPairingTool, PaletteTool } from "./tools-design";
import { ImageCompressorTool, ImageConverterTool, ImageResizerTool, ImagesToPdfTool, WatermarkRemoverTool } from "./tools-image";
import { CurrencyTool, EmiTool, QrTool, TipTool } from "./tools-finance";

export const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "calculator": CalculatorTool, "percentage-calculator": PercentageTool, "unit-converter": UnitConverterTool,
  "age-calculator": AgeTool, "date-difference": DateDiffTool, "countdown": CountdownTool,
  "word-counter": WordCounterTool, "case-converter": CaseConverterTool, "lorem-ipsum": LoremTool,
  "whitespace-cleaner": WhitespaceTool, "text-diff": TextDiffTool,
  "json-formatter": JsonTool, "base64": Base64Tool, "uuid-generator": UuidTool, "url-encoder": UrlTool,
  "regex-tester": RegexTool, "color-converter": ColorConverterTool, "password-generator": PasswordGeneratorTool,
  "password-strength": PasswordStrengthTool,
  "color-picker": ColorPickerTool, "palette-generator": PaletteTool, "font-pairing": FontPairingTool,
  "image-compressor": ImageCompressorTool, "image-resizer": ImageResizerTool, "image-converter": ImageConverterTool, "images-to-pdf": ImagesToPdfTool,
  "watermark-remover": WatermarkRemoverTool,
  "tip-calculator": TipTool, "emi-calculator": EmiTool, "currency-converter": CurrencyTool, "qr-generator": QrTool,
};

export function ToolPage({ tool }: { tool: ToolDef }) {
  const { pushRecent, isFavorite, toggleFavorite } = useStore();
  const Cmp = TOOL_COMPONENTS[tool.slug];
  const cat = getCategory(tool.category);
  const fav = isFavorite(tool.slug);

  useEffect(() => { pushRecent(tool.slug); }, [tool.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const related = publishedTools.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(0, 3);
  const extraRelated = related.length < 3
    ? [...related, ...publishedTools.filter((t) => t.featured && t.slug !== tool.slug && !related.includes(t))].slice(0, 3)
    : related;

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 w-full space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold muted">
        <Link href="/" className="hover:text-[var(--primary)] transition-colors">Home</Link><ChevronRight size={13} />
        <Link href="/tools" className="hover:text-[var(--primary)] transition-colors">Tools</Link><ChevronRight size={13} />
        <Link href={`/categories/${tool.category}`} className="hover:text-[var(--primary)] transition-colors">{cat?.name}</Link><ChevronRight size={13} />
        <span aria-current="page" style={{ color: "var(--text-primary)" }}>{tool.name}</span>
      </nav>

      {/* Tool header: identity, context, and the one non-tool action (favorite) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 pb-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start gap-4 sm:gap-5 min-w-0">
          <span className="hidden sm:grid place-items-center w-14 h-14 rounded-2xl shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
            <ToolIcon name={tool.icon} size={26} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="category-badge">{cat?.name}</span>
              <span className="muted-11 font-bold inline-flex items-center gap-1">
                {tool.slug === "currency-converter"
                  ? <><Globe2 size={12} style={{ color: "var(--warning)" }} /> Live external rate source</>
                  : <><ShieldCheck size={12} style={{ color: "var(--success)" }} /> 100% local · nothing is uploaded</>}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em]">{tool.name}</h1>
            <p className="muted-13 sm:text-sm mt-2 leading-relaxed max-w-2xl">{tool.description}</p>
          </div>
        </div>
        <button className="btn-ghost self-start md:self-auto inline-flex items-center gap-2 shrink-0" aria-pressed={fav} onClick={() => toggleFavorite(tool.slug)}>
          <Heart size={18} style={{ color: fav ? "#EF4444" : "currentColor" }} fill={fav ? "#EF4444" : "none"} />
          <span>{fav ? "Favorited" : "Add to favorites"}</span>
        </button>
      </div>

      {/* Primary workspace — the tool itself is the focus */}
      <section className="card p-5 sm:p-7" aria-label={`${tool.name} workspace`}>
        {Cmp ? <Cmp /> : <p className="muted">This tool is not available.</p>}
      </section>

      {/* Related tools */}
      <section aria-labelledby="related-heading" className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <SectionHeader
          icon={<ChevronRight size={14} />}
          eyebrow="Keep going"
          title={`More ${cat?.name ?? "tools"}`}
          actionHref={`/categories/${tool.category}`}
          actionLabel="View full category"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {extraRelated.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      </section>
    </main>
  );
}
