"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ImageUp, Play, ScanLine, Volume2 } from "lucide-react";
import { EXPANDED_TOOL_SLUGS } from "@/lib/expanded-registry";
import { CALCULATOR_SPECS, calculate, keywordDensity, sentenceSummary } from "@/lib/expanded-logic";
import { CopyButton, DownloadButton, ErrorBox, Field, ResultStat } from "./ui";

const BLOCKED: Record<string, string> = {
  "ai-headshot-profile-picture-maker": "A configured generative-image model is required to create a genuine headshot.",
  "ai-image-background-remover": "A segmentation model is required to identify foreground pixels reliably.",
  "gif-maker": "A GIF encoding dependency is required to produce a valid animated GIF.",
  "image-to-text-ocr": "An OCR engine or provider is required to recognize image text accurately.",
  "merge-pdf": "A PDF page-manipulation engine is required to preserve and merge original pages.",
  "pdf-to-word-converter": "A document-conversion engine is required to create a genuine DOCX file.",
};

const CONTENT_SLUGS = new Set([
  "ai-automation-checklist-generator", "ai-lead-magnet-generator", "ai-automation-idea-generator", "ai-cold-email-generator",
  "ai-customer-support-bot-planner", "ai-faq-generator", "google-review-reply-generator", "ai-job-description-generator",
  "ai-landing-page-headline-tester", "ai-model-comparison-table", "ai-product-description-generator", "ai-prompt-checker",
  "ai-prompt-generator", "ai-proposal-generator", "ai-readiness-assessment", "ai-service-page-builder", "ai-slogan-tagline-generator",
  "ai-social-media-post-generator", "ai-use-case-finder", "ai-website-lead-leak-checker", "ai-whatsapp-message-generator",
  "ats-resume-score-checker", "automation-readiness-quiz", "brand-style-guide-compiler", "brand-voice-generator",
  "business-name-generator", "chatbot-script-generator", "document-pdf-summarizer", "grammar-checker", "meeting-notes-summarizer",
  "privacy-policy-generator", "resume-builder", "social-media-kit-generator", "sop-generator", "text-humanizer", "text-summarizer",
]);

const SEO_SLUGS = new Set([
  "ai-content-gap-checker", "ai-overview-optimizer", "answer-block-generator", "aso-keyword-planner", "faq-schema-generator",
  "keyword-density-checker", "llms-txt-generator", "meta-description-generator", "meta-tag-generator", "robots-txt-generator",
  "schema-markup-generator", "serp-snippet-preview", "website-speed-seo-audit", "xml-sitemap-generator", "zero-click-content-checker",
]);

function CalculatorEngine({ slug }: { slug: string }) {
  const spec = CALCULATOR_SPECS[slug];
  const [raw, setRaw] = useState<Record<string, string>>(() => Object.fromEntries(spec.fields.map((field) => [field.key, String(field.defaultValue)])));
  const result = useMemo(() => {
    try { return { values: calculate(spec, raw), error: "" }; }
    catch (error) { return { values: [], error: error instanceof Error ? error.message : "Unable to calculate." }; }
  }, [raw, spec]);
  return <div className="space-y-5">
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {spec.fields.map((item) => <Field key={item.key} label={item.label} hint={item.hint}>
        <input className="input" type="number" min={item.min} step={item.step} value={raw[item.key]}
          onChange={(event) => setRaw((current) => ({ ...current, [item.key]: event.target.value }))} />
      </Field>)}
    </div>
    <ErrorBox msg={result.error} />
    {!result.error && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-live="polite">
      {result.values.map((item) => <ResultStat key={item.label} label={item.label} value={item.value} />)}
    </div>}
    <p className="hint">{spec.note}</p>
  </div>;
}

function CapabilityBlocked({ slug }: { slug: string }) {
  return <div className="output-box space-y-3" role="status">
    <div className="flex items-center gap-2 font-bold"><AlertTriangle size={19} style={{ color: "var(--warning)" }} /> Integration required</div>
    <p className="muted text-sm">{BLOCKED[slug]}</p>
    <p className="hint">This workflow is intentionally blocked rather than returning a mocked, renamed, or fabricated output.</p>
  </div>;
}

function InvoiceTool() {
  const [client, setClient] = useState("Example Client");
  const [description, setDescription] = useState("Professional services");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("100");
  const [tax, setTax] = useState("0");
  const values = [quantity, rate, tax].map(Number);
  const valid = values.every(Number.isFinite) && values.every((value) => value >= 0) && client.trim() && description.trim();
  const subtotal = valid ? values[0] * values[1] : 0;
  const total = subtotal * (1 + values[2] / 100);
  const output = valid ? `INVOICE\nBill to: ${client.trim()}\nItem: ${description.trim()}\nQuantity: ${values[0]}\nRate: $${values[1].toFixed(2)}\nSubtotal: $${subtotal.toFixed(2)}\nTax: ${values[2]}%\nTotal: $${total.toFixed(2)}\n` : "";
  const href = `data:text/plain;charset=utf-8,${encodeURIComponent(output)}`;
  return <div className="space-y-5"><div className="grid sm:grid-cols-2 gap-4">
    <Field label="Client"><input className="input" value={client} onChange={(e) => setClient(e.target.value)} /></Field>
    <Field label="Description"><input className="input" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
    <Field label="Quantity"><input className="input" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
    <Field label="Rate (USD)"><input className="input" type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
    <Field label="Tax (%)"><input className="input" type="number" min="0" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
  </div><ErrorBox msg={valid ? "" : "Complete all fields with non-negative numeric values."} />
    {valid && <><pre className="output-box whitespace-pre-wrap text-sm">{output}</pre><div className="flex gap-2"><CopyButton text={output} /><DownloadButton href={href} filename="invoice.txt" /></div></>}
  </div>;
}

const ZONES = ["UTC", "America/New_York", "Europe/London", "Asia/Dhaka", "Asia/Tokyo", "Australia/Sydney"];
function TimeZoneTool() {
  const [date, setDate] = useState("2026-01-15T12:00");
  const [zone, setZone] = useState("Asia/Dhaka");
  const parsed = new Date(`${date}:00Z`);
  const valid = date !== "" && !Number.isNaN(parsed.getTime());
  const formatted = valid ? new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "long", timeZone: zone }).format(parsed) : "";
  return <div className="space-y-5"><div className="grid sm:grid-cols-2 gap-4">
    <Field label="Date and time (interpreted as UTC)"><input className="input" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
    <Field label="Destination time zone"><select className="input" value={zone} onChange={(e) => setZone(e.target.value)}>{ZONES.map((item) => <option key={item}>{item}</option>)}</select></Field>
  </div><ErrorBox msg={valid ? "" : "Enter a valid date and time."} />{valid && <div className="output-box" aria-live="polite"><b>{formatted}</b></div>}</div>;
}

function QrScannerTool() {
  const [value, setValue] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const scan = async (file?: File) => {
    setError(""); setValue(""); if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose a valid image file."); return; }
    const Detector = (globalThis as typeof globalThis & { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: ImageBitmap) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector) { setError("QR scanning is not supported by this browser. Use a Chromium browser with Barcode Detector support."); return; }
    setBusy(true);
    try { const bitmap = await createImageBitmap(file); const hits = await new Detector({ formats: ["qr_code"] }).detect(bitmap); bitmap.close(); if (!hits[0]) throw new Error("No QR code was found in this image."); setValue(hits[0].rawValue); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to scan this image."); }
    finally { setBusy(false); }
  };
  return <div className="space-y-4"><Field label="QR code image" hint="Processed locally by your browser."><input className="input" type="file" accept="image/*" onChange={(e) => void scan(e.target.files?.[0])} /></Field>
    {busy && <p className="muted text-sm">Scanning…</p>}<ErrorBox msg={error} />{value && <div className="output-box space-y-3"><p className="break-all">{value}</p><CopyButton text={value} /></div>}</div>;
}

function TextToSpeechTool() {
  const [text, setText] = useState("Welcome to ToolHub."); const [error, setError] = useState("");
  const speak = () => { setError(""); if (!text.trim()) return setError("Enter text to read aloud."); if (!("speechSynthesis" in window)) return setError("Speech synthesis is unavailable in this browser."); window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); };
  return <div className="space-y-4"><Field label="Text"><textarea className="input min-h-40" value={text} onChange={(e) => setText(e.target.value)} /></Field><ErrorBox msg={error} /><div className="flex gap-2"><button className="btn-primary" onClick={speak}><Volume2 size={17} /> Speak</button><button className="btn-ghost" onClick={() => typeof window !== "undefined" && window.speechSynthesis?.cancel()}>Stop</button></div></div>;
}

function ImageUpscalerTool() {
  const [factor, setFactor] = useState("2"); const [result, setResult] = useState<{ href: string; width: number; height: number }>(); const [error, setError] = useState("");
  const process = async (file?: File) => { setError(""); setResult(undefined); if (!file) return; if (!file.type.startsWith("image/")) return setError("Choose a valid image file.");
    try { const bitmap = await createImageBitmap(file); const scale = Number(factor); const canvas = document.createElement("canvas"); canvas.width = bitmap.width * scale; canvas.height = bitmap.height * scale; const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas is unavailable."); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high"; context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close(); setResult({ href: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height }); }
    catch { setError("The image could not be decoded or processed."); } };
  return <div className="space-y-4"><div className="grid sm:grid-cols-2 gap-4"><Field label="Scale"><select className="input" value={factor} onChange={(e) => { setFactor(e.target.value); setResult(undefined); }}><option value="2">2×</option><option value="3">3×</option><option value="4">4×</option></select></Field><Field label="Source image"><input className="input" type="file" accept="image/*" onChange={(e) => void process(e.target.files?.[0])} /></Field></div><ErrorBox msg={error} />{result && <div className="output-box space-y-3"><img className="max-h-80 mx-auto" src={result.href} alt="Upscaled preview" /><p className="text-sm">Output: {result.width} × {result.height}px PNG</p><DownloadButton href={result.href} filename="upscaled.png" /></div>}</div>;
}

function LogoMakerTool() {
  const [name, setName] = useState("ToolHub"); const [tagline, setTagline] = useState("Useful tools, ready now");
  const safeName = name.replace(/[<>&"']/g, ""); const safeTag = tagline.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300"><rect width="800" height="300" rx="36" fill="#ffffff"/><circle cx="130" cy="150" r="72" fill="#6d5dfc"/><path d="M95 150h70M130 115v70" stroke="white" stroke-width="18" stroke-linecap="round"/><text x="235" y="145" font-family="Arial,sans-serif" font-weight="700" font-size="64" fill="#18181b">${safeName}</text><text x="238" y="195" font-family="Arial,sans-serif" font-size="26" fill="#71717a">${safeTag}</text></svg>`;
  const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return <div className="space-y-4"><div className="grid sm:grid-cols-2 gap-4"><Field label="Brand name"><input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></Field><Field label="Tagline"><input className="input" value={tagline} maxLength={70} onChange={(e) => setTagline(e.target.value)} /></Field></div><div className="output-box"><img src={href} alt="Generated logo preview" /></div><DownloadButton href={href} filename="logo.svg" label="Download SVG" /></div>;
}

function grammarReport(text: string) {
  const issues: string[] = [];
  if (/\s{2,}/.test(text)) issues.push("Repeated spaces found.");
  if (/\bi\b/.test(text)) issues.push("The pronoun “I” should be uppercase.");
  if (/\b(very|really)\s+\1\b/i.test(text)) issues.push("Repeated intensifier found.");
  if (text.trim() && !/[.!?]$/.test(text.trim())) issues.push("Final punctuation may be missing.");
  return issues.length ? issues.map((issue) => `• ${issue}`).join("\n") : "No common rule-based issues found.";
}

function generateContent(slug: string, topic: string, audience: string, details: string) {
  const source = `${topic}. ${audience}. ${details}`.trim();
  if (slug === "text-summarizer" || slug === "document-pdf-summarizer") return sentenceSummary(source, 3) || "Add enough source text to summarize.";
  if (slug === "grammar-checker") return grammarReport(source);
  if (slug === "text-humanizer") return source.replace(/\butilize\b/gi, "use").replace(/\bin order to\b/gi, "to").replace(/\bvery\b/gi, "").replace(/\s{2,}/g, " ").trim();
  if (slug === "meeting-notes-summarizer") return `KEY POINTS\n${sentenceSummary(source, 2)}\n\nDECISIONS\n• Review explicit decisions in the source notes.\n\nACTION ITEMS\n${source.split(/\n/).filter((line) => /\b(todo|action|will|owner|due)\b/i.test(line)).map((line) => `• ${line.trim()}`).join("\n") || "• No explicitly labelled action items detected."}`;
  if (slug === "ai-prompt-checker") { const checks = [[topic.length > 20, "clear task/context"], [audience.length > 2, "defined audience or role"], [details.length > 15, "constraints/output details"]] as const; const score = checks.filter(([pass]) => pass).length; return `Prompt score: ${score}/3\n${checks.map(([pass, label]) => `${pass ? "✓" : "○"} ${label}`).join("\n")}`; }
  if (slug === "ai-landing-page-headline-tester") { const words = topic.trim().split(/\s+/).filter(Boolean); const score = (words.length >= 4 && words.length <= 12 ? 40 : 15) + (/\d|free|save|grow|faster/i.test(topic) ? 30 : 10) + (audience.trim() ? 30 : 0); return `Headline score: ${score}/100\nLength: ${words.length} words\n${score >= 70 ? "Clear and specific foundation." : "Add a specific audience, benefit, or proof point."}`; }
  if (slug === "ats-resume-score-checker") { const wanted = new Set(audience.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? []); const resume = new Set(`${topic} ${details}`.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? []); const matched = [...wanted].filter((word) => resume.has(word)); const score = wanted.size ? Math.round(matched.length / wanted.size * 100) : 0; return `Keyword coverage: ${score}%\nMatched: ${matched.join(", ") || "none"}\nMissing: ${[...wanted].filter((word) => !resume.has(word)).slice(0, 20).join(", ") || "none"}`; }
  const title = slug.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ").replace(/^Ai /, "AI ");
  return `${title}\n\nObjective\nCreate a practical result for ${audience || "the intended audience"} about ${topic || "the supplied topic"}.\n\nRecommended structure\n1. Lead with the main outcome.\n2. Explain the problem and relevant context.\n3. Present three concrete actions or benefits.\n4. Address the strongest concern.\n5. Close with a clear next step.\n\nDraft\n${details || "Add supporting details, proof, constraints, and a call to action."}\n\nReview checklist\n• Verify every factual claim.\n• Replace generic language with specific evidence.\n• Edit tone for the intended audience.`;
}

function ContentEngine({ slug }: { slug: string }) {
  const [topic, setTopic] = useState(""); const [audience, setAudience] = useState(""); const [details, setDetails] = useState(""); const [output, setOutput] = useState("");
  return <div className="space-y-5"><p className="chip inline-flex">Rule-based local generator · no AI provider call</p><div className="grid sm:grid-cols-2 gap-4">
    <Field label={slug === "ats-resume-score-checker" ? "Resume text" : "Topic, goal, or source text"}><textarea className="input min-h-32" value={topic} onChange={(e) => setTopic(e.target.value)} /></Field>
    <Field label={slug === "ats-resume-score-checker" ? "Job description" : "Audience, role, or context"}><textarea className="input min-h-32" value={audience} onChange={(e) => setAudience(e.target.value)} /></Field>
  </div><Field label="Details, constraints, or notes"><textarea className="input min-h-28" value={details} onChange={(e) => setDetails(e.target.value)} /></Field>
    <button className="btn-primary" disabled={!`${topic}${audience}${details}`.trim()} onClick={() => setOutput(generateContent(slug, topic, audience, details))}><Play size={17} /> Generate locally</button>
    {output && <div className="space-y-3"><pre className="output-box whitespace-pre-wrap text-sm" aria-live="polite">{output}</pre><CopyButton text={output} /></div>}
  </div>;
}

function generateSeo(slug: string, primary: string, secondary: string) {
  if (slug === "keyword-density-checker") { const result = keywordDensity(primary, secondary); return `Occurrences: ${result.count}\nWords: ${result.words}\nDensity: ${result.density.toFixed(2)}%`; }
  if (slug === "faq-schema-generator") { const pairs = primary.split(/\n+/).map((line) => line.split("|")).filter((pair) => pair.length > 1); return JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: pairs.map(([name, text]) => ({ "@type": "Question", name: name.trim(), acceptedAnswer: { "@type": "Answer", text: text.trim() } })) }, null, 2); }
  if (slug === "xml-sitemap-generator") { const urls = primary.split(/\s+/).filter((url) => /^https?:\/\//.test(url)); return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</loc></url>`).join("\n")}\n</urlset>`; }
  if (slug === "robots-txt-generator") return `User-agent: *\n${primary.trim() ? primary.split(/\n/).map((path) => `Disallow: ${path.trim()}`).join("\n") : "Allow: /"}\n${secondary.trim() ? `Sitemap: ${secondary.trim()}` : ""}`.trim();
  if (slug === "meta-tag-generator") return `<title>${primary.slice(0, 60)}</title>\n<meta name="description" content="${secondary.slice(0, 160).replace(/"/g, "&quot;")}">\n<meta property="og:title" content="${primary.slice(0, 60)}">\n<meta property="og:description" content="${secondary.slice(0, 160).replace(/"/g, "&quot;")}">`;
  if (slug === "schema-markup-generator") return JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: primary.trim(), description: secondary.trim() }, null, 2);
  if (slug === "llms-txt-generator") return `# ${primary || "Website"}\n\n> ${secondary || "Add a concise site description."}\n\n## Important resources\n- [Home](/)\n- [Documentation](/docs)`;
  if (slug === "meta-description-generator") return `${primary.slice(0, 110)}${secondary ? ` — ${secondary}` : ""}`.slice(0, 160);
  if (slug === "answer-block-generator") return `${primary.trim()}\n\n${sentenceSummary(secondary, 2) || secondary.trim()}`;
  const terms = secondary.toLowerCase().split(/[,\n]+/).map((item) => item.trim()).filter(Boolean); const lower = primary.toLowerCase(); const missing = terms.filter((term) => !lower.includes(term));
  return `Local content analysis\n\nInput length: ${primary.length} characters\nTarget terms: ${terms.length}\nCovered: ${terms.length - missing.length}\nMissing: ${missing.join(", ") || "none"}\n\nChecks\n${primary.length >= 200 ? "✓" : "○"} Substantive source text\n${/\?/.test(primary) ? "✓" : "○"} Includes a user question\n${/\n[-*#]|\n\d+\./.test(primary) ? "✓" : "○"} Scannable structure\n\nThis is based only on supplied content; no live website crawl was performed.`;
}

function SeoEngine({ slug }: { slug: string }) {
  const [primary, setPrimary] = useState(""); const [secondary, setSecondary] = useState(""); const output = useMemo(() => generateSeo(slug, primary, secondary), [slug, primary, secondary]);
  return <div className="space-y-5"><p className="chip inline-flex">Local analysis · no live crawl</p><div className="grid sm:grid-cols-2 gap-4"><Field label="Page content, name, URLs, or question"><textarea className="input min-h-40" value={primary} onChange={(e) => setPrimary(e.target.value)} /></Field><Field label="Target terms, description, or supporting answer"><textarea className="input min-h-40" value={secondary} onChange={(e) => setSecondary(e.target.value)} /></Field></div><pre className="output-box whitespace-pre-wrap text-sm" aria-live="polite">{output}</pre><CopyButton text={output} /></div>;
}

function ExpandedTool({ slug }: { slug: string }) {
  if (CALCULATOR_SPECS[slug]) return <CalculatorEngine slug={slug} />;
  if (BLOCKED[slug]) return <CapabilityBlocked slug={slug} />;
  if (CONTENT_SLUGS.has(slug)) return <ContentEngine slug={slug} />;
  if (SEO_SLUGS.has(slug)) return <SeoEngine slug={slug} />;
  if (slug === "invoice-generator") return <InvoiceTool />;
  if (slug === "time-zone-converter") return <TimeZoneTool />;
  if (slug === "qr-code-scanner") return <QrScannerTool />;
  if (slug === "text-to-speech") return <TextToSpeechTool />;
  if (slug === "image-upscaler-enhancer") return <ImageUpscalerTool />;
  if (slug === "simple-logo-maker") return <LogoMakerTool />;
  return <CapabilityBlocked slug={slug} />;
}

const componentFor = (slug: string) => function ExpandedToolComponent() { return <ExpandedTool slug={slug} />; };
export const EXPANDED_TOOL_COMPONENTS: Record<string, React.ComponentType> = Object.fromEntries(EXPANDED_TOOL_SLUGS.map((slug) => [slug, componentFor(slug)]));

