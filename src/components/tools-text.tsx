"use client";
import { useMemo, useState } from "react";
import { cleanWhitespace, convertCase, diffLines, lorem, textStats } from "@/lib/logic";
import { CopyButton, Field, ResultStat } from "./ui";

export function WordCounterTool() {
  const [text, setText] = useState("");
  const s = useMemo(() => textStats(text), [text]);
  return (
    <div>
      <Field label="Your text" hint="Counts update live. Nothing leaves your browser.">
        <textarea className="input" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Start typing or paste your text here…" />
      </Field>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <ResultStat label="Words" value={String(s.words)} /><ResultStat label="Characters" value={String(s.chars)} />
        <ResultStat label="No spaces" value={String(s.charsNoSpaces)} /><ResultStat label="Sentences" value={String(s.sentences)} />
        <ResultStat label="Lines" value={String(s.lines)} /><ResultStat label="Paragraphs" value={String(s.paragraphs)} />
        <ResultStat label="Reading time" value={s.words ? `${Math.max(1, Math.ceil(s.readingMinutes))} min` : "0 min"} />
        <ResultStat label="Speaking time" value={s.words ? `${Math.max(1, Math.ceil(s.speakingMinutes))} min` : "0 min"} />
      </div>
    </div>
  );
}

export function CaseConverterTool() {
  const [text, setText] = useState(""); const [mode, setMode] = useState("upper");
  const out = useMemo(() => convertCase(text, mode), [text, mode]);
  const modes = [["upper", "UPPERCASE"], ["lower", "lowercase"], ["title", "Title Case"], ["sentence", "Sentence case"], ["camel", "camelCase"], ["pascal", "PascalCase"], ["snake", "snake_case"], ["kebab", "kebab-case"], ["constant", "CONSTANT_CASE"]];
  return (
    <div>
      <Field label="Input text"><textarea className="input" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text to convert…" /></Field>
      <div className="flex flex-wrap gap-2 my-4" role="group" aria-label="Case style">{modes.map(([m, l]) => <button key={m} className="chip mono" aria-pressed={mode === m} onClick={() => setMode(m)}>{l}</button>)}</div>
      <Field label="Result"><textarea className="input mono" rows={5} readOnly value={out} placeholder="Converted text appears here" /></Field>
      <div className="mt-3"><CopyButton text={out} /></div>
    </div>
  );
}

export function LoremTool() {
  const [kind, setKind] = useState<"words" | "sentences" | "paragraphs">("paragraphs"); const [count, setCount] = useState(3); const [seed, setSeed] = useState(0);
  const out = useMemo(() => lorem(kind, Math.max(1, Math.min(500, count))), [kind, count, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <div><span className="label">Generate</span><div className="flex gap-2">{(["paragraphs", "sentences", "words"] as const).map((k) => <button key={k} className="chip capitalize" aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}</div></div>
        <div className="w-32"><Field label="Count (1–500)"><input className="input" type="number" min={1} max={500} value={count} onChange={(e) => setCount(Number(e.target.value))} /></Field></div>
        <button className="btn-primary" onClick={() => setSeed((s) => s + 1)}>Regenerate</button>
      </div>
      <div className="output-box mt-5 whitespace-pre-wrap leading-relaxed text-[0.95rem] max-h-96 overflow-auto">{out}</div>
      <div className="mt-3"><CopyButton text={out} /></div>
    </div>
  );
}

export function WhitespaceTool() {
  const [text, setText] = useState(""); const [opts, setOpts] = useState({ trim: true, collapseSpaces: true, collapseLines: true, trimLines: false, removeBlank: false });
  const out = useMemo(() => cleanWhitespace(text, opts), [text, opts]);
  const toggle = (k: keyof typeof opts) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  const labels: [keyof typeof opts, string][] = [["trim", "Trim start & end"], ["collapseSpaces", "Collapse repeated spaces/tabs"], ["trimLines", "Trim each line"], ["collapseLines", "Collapse 3+ blank lines to one"], ["removeBlank", "Remove all blank lines"]];
  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Field label="Input"><textarea className="input mono" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={"  Paste   messy    text  \n\n\nlike this…"} /></Field>
        <Field label="Cleaned output"><textarea className="input mono" rows={9} readOnly value={out} placeholder="Cleaned text appears here" /></Field>
      </div>
      <fieldset className="mt-4"><legend className="label">Options</legend><div className="flex flex-wrap gap-x-6 gap-y-3">
        {labels.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm font-medium cursor-pointer min-h-[36px]"><input type="checkbox" checked={opts[k]} onChange={() => toggle(k)} />{l}</label>)}
      </div></fieldset>
      <p className="hint mt-2">Before: {text.length} chars → After: {out.length} chars ({Math.max(0, text.length - out.length)} removed)</p>
      <div className="mt-2"><CopyButton text={out} /></div>
    </div>
  );
}

export function TextDiffTool() {
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const lines = useMemo(() => (a || b) ? diffLines(a, b) : [], [a, b]);
  const added = lines.filter((l) => l.type === "add").length, removed = lines.filter((l) => l.type === "remove").length;
  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Field label="Original text"><textarea className="input mono" rows={9} value={a} onChange={(e) => setA(e.target.value)} placeholder="Original version…" /></Field>
        <Field label="Changed text"><textarea className="input mono" rows={9} value={b} onChange={(e) => setB(e.target.value)} placeholder="New version…" /></Field>
      </div>
      {lines.length > 0 && <>
        <p className="text-sm font-semibold mt-5 mb-2"><span style={{ color: "var(--success)" }}>+{added} added</span> · <span style={{ color: "var(--error)" }}>−{removed} removed</span></p>
        <div className="card overflow-auto max-h-[480px] mono text-[0.85rem] leading-relaxed" role="region" aria-label="Diff result">
          {lines.map((l, i) => (
            <div key={i} className="px-4 py-1 flex gap-3" style={l.type === "add" ? { background: "color-mix(in srgb, var(--success) 12%, transparent)" } : l.type === "remove" ? { background: "color-mix(in srgb, var(--error) 10%, transparent)" } : {}}>
              <span className="select-none w-4 shrink-0 font-bold" style={{ color: l.type === "add" ? "var(--success)" : l.type === "remove" ? "var(--error)" : "var(--text-secondary)" }}>{l.type === "add" ? "+" : l.type === "remove" ? "−" : " "}</span>
              <span className="whitespace-pre-wrap break-all">{l.text || "\u00A0"}</span>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}
