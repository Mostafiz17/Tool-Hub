"use client";
import { useMemo, useState } from "react";
import { hexToRgb, palette, rgbToHex, rgbToHsl } from "@/lib/logic";
import { CopyButton, Field } from "./ui";
import { ColorSwatch } from "./tools-dev";

function ColorReadouts({ hex }: { hex: string }) {
  const { r, g, b } = hexToRgb(hex); const hsl = rgbToHsl(r, g, b);
  const rows = [["HEX", hex.toUpperCase()], ["RGB", `rgb(${r}, ${g}, ${b})`], ["HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`]];
  return <div className="space-y-2">{rows.map(([l, v]) => (
    <div key={l} className="flex items-center justify-between gap-2 card px-4 py-2.5"><span className="mono text-sm"><b className="mr-2">{l}</b>{v}</span><CopyButton text={v} /></div>))}
  </div>;
}

export function ColorPickerTool() {
  const [hex, setHex] = useState("#2563EB");
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Field label="Pick a color" hint="Native picker plus direct HEX entry.">
          <div className="flex gap-3 items-center">
            <input type="color" aria-label="Color picker" className="w-20 h-20 rounded-2xl border cursor-pointer" style={{ borderColor: "var(--border)" }} value={hex} onChange={(e) => setHex(e.target.value.toUpperCase())} />
            <input className="input mono" value={hex} onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setHex(v.toUpperCase()); }} aria-label="HEX value" />
          </div>
        </Field>
        {/^#[0-9a-fA-F]{6}$/.test(hex) && <ColorReadouts hex={hex} />}
      </div>
      <ColorSwatch hex={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#2563EB"} />
    </div>
  );
}

export function PaletteTool() {
  const [hex, setHex] = useState("#2563EB"); const [mode, setMode] = useState<"complementary" | "analogous" | "triadic" | "monochromatic">("complementary");
  const colors = useMemo(() => { try { return palette(hex, mode); } catch { return []; } }, [hex, mode]);
  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Base color"><div className="flex gap-2"><input type="color" aria-label="Base color" className="w-12 h-[44px] rounded-lg border cursor-pointer" style={{ borderColor: "var(--border)" }} value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#2563EB"} onChange={(e) => setHex(e.target.value.toUpperCase())} />
          <input className="input mono !w-32" value={hex} onChange={(e) => setHex(e.target.value)} /></div></Field>
        <div><span className="label">Harmony</span><div className="flex flex-wrap gap-2">{(["complementary", "analogous", "triadic", "monochromatic"] as const).map((m) => <button key={m} className="chip capitalize" aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>)}</div></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
        {colors.map((c) => (
          <div key={c} className="card overflow-hidden"><div className="h-24" style={{ background: c }} /><div className="p-3 flex items-center justify-between gap-1"><span className="mono text-xs font-bold">{c}</span><CopyButton text={c} /></div></div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><CopyButton text={colors.join(", ")} label="Copy all HEX" /><CopyButton text={colors.map((c, i) => `--color-${i + 1}: ${c};`).join("\n")} label="Copy as CSS variables" /></div>
      <p className="hint">Palettes are computed from real HSL color-wheel relationships (complementary = +180°, triadic = +120°/+240°, analogous = ±20°/±40°).</p>
    </div>
  );
}

const PAIRINGS = [
  { name: "Modern SaaS", heading: "Inter", body: "Inter", note: "Clean, neutral, product-focused. Weights do the hierarchy work.", css: "font-family: 'Inter', system-ui, sans-serif;" },
  { name: "Editorial Serif", heading: "Georgia", body: "system-ui", note: "Georgia is on virtually every device — trustworthy editorial voice with a fast system body.", css: "Headings: Georgia, 'Times New Roman', serif · Body: system-ui, sans-serif" },
  { name: "Tech Mono Accent", heading: "ui-monospace", body: "system-ui", note: "Monospace headings signal developer tools; system body keeps reading effortless.", css: "Headings: ui-monospace, 'SF Mono', Menlo, monospace · Body: system-ui, sans-serif" },
  { name: "Classic Book", heading: "'Palatino Linotype'", body: "Georgia", note: "Warm old-style serifs for long-form reading and documentation.", css: "font-family: 'Palatino Linotype', Palatino, Georgia, serif;" },
  { name: "Bold Swiss", heading: "'Helvetica Neue'", body: "'Helvetica Neue'", note: "Helvetica/Arial grotesque with tight heading tracking — poster-like and confident.", css: "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; letter-spacing: -0.02em on headings" },
  { name: "Friendly Rounded Feel", heading: "Verdana", body: "Verdana", note: "Wide, open letterforms at small sizes; friendly for education and consumer apps.", css: "font-family: Verdana, Geneva, sans-serif;" },
];
export function FontPairingTool() {
  const [active, setActive] = useState(0); const p = PAIRINGS[active];
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">{PAIRINGS.map((x, i) => <button key={x.name} className="chip" aria-pressed={active === i} onClick={() => setActive(i)}>{x.name}</button>)}</div>
      <div className="card p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest muted">{p.name}</p>
        <h3 className="text-3xl sm:text-4xl font-extrabold mt-3 leading-tight" style={{ fontFamily: p.heading }}>Design headings that earn attention</h3>
        <p className="mt-4 leading-relaxed text-[1.05rem]" style={{ fontFamily: p.body }}>Good typography pairs a distinctive display voice with a body face optimized for long reading. Every pairing here uses fonts genuinely available via system stacks or this site&apos;s loaded Inter — so what you preview is what you ship.</p>
        <p className="mt-3 text-sm muted">{p.note}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4"><code className="mono text-xs card px-3 py-2 break-all">{p.css}</code><CopyButton text={p.css} label="Copy CSS" /></div>
    </div>
  );
}
export { rgbToHex };
