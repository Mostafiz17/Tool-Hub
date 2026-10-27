"use client";
import { useMemo, useState } from "react";
import { base64DecodeUnicode, base64EncodeUnicode, formatJson, generatePassword, hexToRgb, hslToRgb, passwordStrength, rgbToHex, rgbToHsl, uuidv4 } from "@/lib/logic";
import { CopyButton, ErrorBox, Field } from "./ui";

export function JsonTool() {
  const [input, setInput] = useState(""); const [indent, setIndent] = useState(2); const [res, setRes] = useState<{ ok: boolean; text: string }>({ ok: true, text: "" });
  const run = (ind: number) => { const r = formatJson(input, ind); setRes(r.ok ? { ok: true, text: r.output } : { ok: false, text: r.error }); };
  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Field label="JSON input"><textarea className="input mono" rows={11} value={input} onChange={(e) => setInput(e.target.value)} placeholder='{"name":"ToolHub","tools":30}' aria-invalid={!res.ok} /></Field>
        <Field label={res.ok ? "Formatted output" : "Error"}><textarea className="input mono" rows={11} readOnly value={res.ok ? res.text : ""} placeholder="Formatted JSON appears here" /></Field>
      </div>
      {!res.ok && <div className="mt-3"><ErrorBox msg={`Invalid JSON — ${res.text}`} /></div>}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <label className="text-sm font-semibold flex items-center gap-2">Indent
          <select className="input !w-auto !min-h-[40px]" value={indent} onChange={(e) => setIndent(Number(e.target.value))}><option value={2}>2 spaces</option><option value={4}>4 spaces</option><option value={0}>Minify</option></select></label>
        <button className="btn-primary" onClick={() => run(indent)}>{indent === 0 ? "Minify" : "Format & Validate"}</button>
        <button className="btn-ghost" onClick={() => run(0)}>Minify</button>
        <CopyButton text={res.ok ? res.text : ""} />
        {res.ok && res.text && <span className="text-sm font-semibold" style={{ color: "var(--success)" }}>✓ Valid JSON</span>}
      </div>
    </div>
  );
}

export function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode"); const [input, setInput] = useState("");
  const { out, err } = useMemo(() => { if (!input) return { out: "", err: "" }; try { return { out: mode === "encode" ? base64EncodeUnicode(input) : base64DecodeUnicode(input), err: "" }; } catch (e) { return { out: "", err: e instanceof Error ? e.message : "Invalid input" }; } }, [input, mode]);
  return (
    <div>
      <div className="flex gap-2 mb-4">{(["encode", "decode"] as const).map((m) => <button key={m} className="chip capitalize" aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>)}</div>
      <Field label={mode === "encode" ? "Text to encode (Unicode supported 🌍)" : "Base64 to decode"}><textarea className="input mono" rows={6} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? "Hello, 世界! 👋" : "SGVsbG8sIOS4lueVjCEg8J+Riw=="} /></Field>
      <div className="mt-3"><ErrorBox msg={err} /></div>
      <Field label="Result"><textarea className="input mono mt-4" rows={6} readOnly value={out} placeholder="Result appears here" /></Field>
      <div className="mt-3"><CopyButton text={out} /></div>
    </div>
  );
}

export function UuidTool() {
  const [count, setCount] = useState(5); const [list, setList] = useState<string[]>(() => [uuidv4()]);
  const gen = () => setList(Array.from({ length: Math.max(1, Math.min(100, count)) }, uuidv4));
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-36"><Field label="How many (1–100)"><input className="input" type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} /></Field></div>
        <button className="btn-primary" onClick={gen}>Generate UUIDs</button>
        <CopyButton text={list.join("\n")} label="Copy all" />
      </div>
      <ul className="mt-4 space-y-2">{list.map((u) => (
        <li key={u} className="flex items-center justify-between gap-3 card px-4 py-2.5"><span className="mono text-sm break-all">{u}</span><CopyButton text={u} /></li>))}
      </ul>
      <p className="hint">Version 4 UUIDs generated with <span className="mono">crypto.getRandomValues</span> (cryptographically secure).</p>
    </div>
  );
}

export function UrlTool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode"); const [input, setInput] = useState("");
  const { out, err } = useMemo(() => { if (!input) return { out: "", err: "" }; try { return { out: mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input), err: "" }; } catch { return { out: "", err: "Malformed percent-encoding (e.g. incomplete % sequences)." }; } }, [input, mode]);
  return (
    <div>
      <div className="flex gap-2 mb-4">{(["encode", "decode"] as const).map((m) => <button key={m} className="chip capitalize" aria-pressed={mode === m} onClick={() => setMode(m)}>{m} component</button>)}</div>
      <Field label="Input"><textarea className="input mono" rows={5} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? "https://example.com/search?q=hello world&lang=en" : "hello%20world%26more"} /></Field>
      <div className="mt-3"><ErrorBox msg={err} /></div>
      <Field label="Result"><textarea className="input mono mt-4" rows={5} readOnly value={out} /></Field>
      <div className="mt-3"><CopyButton text={out} /></div>
      <p className="hint">Uses encodeURIComponent/decodeURIComponent semantics — ideal for individual query values.</p>
    </div>
  );
}

export function RegexTool() {
  const [pattern, setPattern] = useState(""); const [flags, setFlags] = useState("gi"); const [text, setText] = useState("");
  const result = useMemo(() => {
    if (!pattern) return { err: "", matches: [] as { text: string; index: number; groups: string[] }[], parts: [] as { text: string; hit: boolean }[] };
    let re: RegExp; try { re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g"); } catch (e) { return { err: e instanceof Error ? e.message : "Invalid pattern", matches: [], parts: [] }; }
    const matches: { text: string; index: number; groups: string[] }[] = []; const parts: { text: string; hit: boolean }[] = [];
    let last = 0, m: RegExpExecArray | null, guard = 0;
    while ((m = re.exec(text)) && guard++ < 500) { if (m[0] === "") { re.lastIndex++; continue; } matches.push({ text: m[0], index: m.index, groups: m.slice(1) }); parts.push({ text: text.slice(last, m.index), hit: false }, { text: m[0], hit: true }); last = m.index + m[0].length; }
    parts.push({ text: text.slice(last), hit: false });
    return { err: "", matches, parts };
  }, [pattern, flags, text]);
  return (
    <div>
      <div className="grid sm:grid-cols-[1fr_auto] gap-3">
        <Field label="Pattern (no slashes)"><input className="input mono" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="\b\w+@\w+\.\w+\b" /></Field>
        <Field label="Flags"><input className="input mono !w-24" value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))} aria-label="Regex flags" /></Field>
      </div>
      <div className="mt-3"><ErrorBox msg={result.err} /></div>
      <div className="mt-4"><Field label="Test text"><textarea className="input mono" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text to test against…" /></Field></div>
      {pattern && !result.err && <>
        <p className="font-semibold text-sm mt-5 mb-2">{result.matches.length} match{result.matches.length === 1 ? "" : "es"}{result.matches.length >= 500 ? " (capped at 500 for performance)" : ""}</p>
        <div className="output-box mono text-sm whitespace-pre-wrap break-words leading-relaxed" aria-label="Highlighted matches">
          {result.parts.map((p, i) => p.hit ? <mark key={i} className="rounded px-0.5" style={{ background: "var(--primary)", color: "#fff" }}>{p.text}</mark> : <span key={i}>{p.text}</span>)}
        </div>
        {result.matches.length > 0 && <ul className="mt-3 space-y-1.5 max-h-52 overflow-auto">{result.matches.slice(0, 100).map((m, i) => (
          <li key={i} className="text-sm mono card px-3 py-2">#{i + 1} <b>“{m.text}”</b> <span className="muted">@ index {m.index}</span>{m.groups.length ? <span className="muted"> · groups: {m.groups.map((g) => `“${g ?? ""}”`).join(", ")}</span> : null}</li>))}
        </ul>}
      </>}
    </div>
  );
}

function ColorSwatch({ hex }: { hex: string }) {
  return <div className="rounded-2xl border h-28 grid place-items-end p-3" style={{ background: hex, borderColor: "var(--border)" }}><span className="mono text-xs font-bold px-2 py-1 rounded-md bg-black/55 text-white">{hex}</span></div>;
}
export { ColorSwatch };

export function ColorConverterTool() {
  const [hex, setHex] = useState("#2563EB");
  const { vals, err } = useMemo(() => { try { const { r, g, b } = hexToRgb(hex); const hsl = rgbToHsl(r, g, b); return { vals: { rgb: `rgb(${r}, ${g}, ${b})`, hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` }, err: "" }; } catch (e) { return { vals: null, err: e instanceof Error ? e.message : "Invalid color" }; } }, [hex]);
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Field label="HEX color"><div className="flex gap-2"><input type="color" aria-label="Pick a color" className="w-12 h-[44px] rounded-lg border cursor-pointer shrink-0" style={{ borderColor: "var(--border)" }} value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#2563EB"} onChange={(e) => setHex(e.target.value.toUpperCase())} />
          <input className="input mono" value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#2563EB" /></div></Field>
        <ErrorBox msg={err} />
        {vals && <div className="space-y-2">
          {[["HEX", hex.toUpperCase()], ["RGB", vals.rgb], ["HSL", vals.hsl]].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between gap-2 card px-4 py-2.5"><span className="mono text-sm"><b className="mr-2">{l}</b>{v}</span><CopyButton text={v} /></div>))}
        </div>}
      </div>
      <ColorSwatch hex={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex) ? hex : "#2563EB"} />
    </div>
  );
}

export function PasswordGeneratorTool() {
  const [len, setLen] = useState(16); const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false });
  const [pw, setPw] = useState(() => generatePassword(16, { lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false }));
  const [err, setErr] = useState("");
  const gen = () => { try { setPw(generatePassword(Math.max(4, Math.min(128, len)), opts)); setErr(""); } catch (e) { setErr(e instanceof Error ? e.message : "Error"); } };
  const labels: [keyof typeof opts, string][] = [["lower", "Lowercase (a-z)"], ["upper", "Uppercase (A-Z)"], ["digits", "Digits (0-9)"], ["symbols", "Symbols (!@#$…)"], ["excludeAmbiguous", "Exclude ambiguous (l, 1, I, O, 0)"]];
  return (
    <div>
      <div className="output-box flex flex-wrap items-center justify-between gap-3">
        <span className="mono font-bold text-lg break-all" aria-live="polite">{pw}</span>
        <span className="flex gap-2"><button className="btn-primary btn-sm" onClick={gen}>Regenerate</button><CopyButton text={pw} /></span>
      </div>
      <div className="mt-3"><ErrorBox msg={err} /></div>
      <div className="grid sm:grid-cols-2 gap-5 mt-5">
        <Field label={`Length: ${len} characters`}><input type="range" min={4} max={128} value={len} onChange={(e) => setLen(Number(e.target.value))} className="w-full" aria-label="Password length" /></Field>
        <fieldset><legend className="label">Character sets</legend><div className="space-y-2">{labels.map(([k, l]) => (
          <label key={k} className="flex items-center gap-2 text-sm font-medium cursor-pointer min-h-[32px]"><input type="checkbox" checked={opts[k]} onChange={() => setOpts((o) => ({ ...o, [k]: !o[k] }))} />{l}</label>))}
        </div></fieldset>
      </div>
      <p className="hint">Generated locally with Web Crypto. At least one character from every selected set is guaranteed. Never stored or transmitted.</p>
    </div>
  );
}

export function PasswordStrengthTool() {
  const [pw, setPw] = useState(""); const [show, setShow] = useState(false);
  const s = useMemo(() => passwordStrength(pw), [pw]);
  const colors = ["var(--border)", "var(--error)", "#EA580C", "var(--warning)", "var(--success)", "var(--success)"];
  return (
    <div className="max-w-xl">
      <Field label="Password to check" hint="Checked 100% locally — never typed into any network request.">
        <div className="flex gap-2"><input className="input mono" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Type a password…" autoComplete="off" />
          <button className="btn-ghost btn-sm shrink-0" onClick={() => setShow(!show)} aria-pressed={show}>{show ? "Hide" : "Show"}</button></div>
      </Field>
      {pw && <>
        <div className="flex gap-1.5 mt-5" role="img" aria-label={`Strength: ${s.label}`}>{[1, 2, 3, 4, 5].map((i) => <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: i <= s.score ? colors[s.score] : "var(--border)" }} />)}</div>
        <p className="mt-3 text-lg font-extrabold">{s.label} <span className="text-sm muted font-medium">· ≈ {s.entropy} bits of entropy · {pw.length} characters</span></p>
        <ul className="mt-2 space-y-1.5 text-sm muted">{s.feedback.map((f, i) => <li key={i}>• {f}</li>)}</ul>
      </>}
      <p className="hint mt-4">Estimates are heuristic: real strength also depends on whether the password has appeared in breaches. Use a password manager and unique passwords per site.</p>
    </div>
  );
}
