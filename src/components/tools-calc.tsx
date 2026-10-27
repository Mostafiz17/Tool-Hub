"use client";
import { useEffect, useMemo, useState } from "react";
import { Delete, Equal } from "lucide-react";
import { ageFromDob, convertUnit, dateDiff, evaluateExpression, fmt, pctChange, pctDifference, pctOf, UNITS, type UnitCategory } from "@/lib/logic";
import { CopyButton, ErrorBox, Field, ResultStat } from "./ui";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function CalculatorTool() {
  const [expr, setExpr] = useState(""); const [result, setResult] = useState<string | null>(null); const [err, setErr] = useState("");
  const calc = () => { try { const v = evaluateExpression(expr); setResult(String(v)); setErr(""); } catch (e) { setErr(e instanceof Error ? e.message : "Invalid expression"); setResult(null); } };
  const press = (k: string) => {
    if (k === "C") { setExpr(""); setResult(null); setErr(""); }
    else if (k === "⌫") setExpr((s) => s.slice(0, -1));
    else if (k === "=") calc();
    else setExpr((s) => (result !== null && /[0-9.]/.test(k) ? k : s + k));
    if (k !== "=") setResult(null);
  };
  const keys = ["C", "(", ")", "⌫", "7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "%", "+", "="];
  return (
    <div className="max-w-md">
      <div className="output-box mb-4 text-right" aria-live="polite">
        <input aria-label="Calculator expression" className="w-full bg-transparent text-right text-lg mono outline-none" value={expr} placeholder="0"
          onChange={(e) => setExpr(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") calc(); if (/^[0-9+\-*/%.() ]$/.test(e.key)) return; if (!["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault(); }} />
        <p className="text-3xl font-extrabold mono mt-1">{result !== null ? `= ${result}` : "\u00A0"}</p>
      </div>
      <ErrorBox msg={err} />
      <div className="grid grid-cols-4 gap-2 mt-3">
        {keys.map((k) => (
          <button key={k} onClick={() => press(k)} aria-label={k === "⌫" ? "Delete" : k === "C" ? "Clear" : k}
            className={`min-h-[52px] rounded-xl font-bold text-lg border ${k === "=" ? "text-white" : ""}`}
            style={k === "=" ? { background: "var(--primary)", borderColor: "var(--primary)" } : { background: "var(--surface)", borderColor: "var(--border)", color: k === "C" ? "var(--error)" : "var(--text-primary)" }}>
            {k === "⌫" ? <Delete className="mx-auto" size={20} /> : k === "=" ? <Equal className="mx-auto" size={20} /> : k}
          </button>
        ))}
      </div>
      <p className="hint">Keyboard supported: digits, + − * / % . ( ) and Enter. Division by zero is reported, never crashes.</p>
    </div>
  );
}

export function PercentageTool() {
  const [mode, setMode] = useState("of"); const [a, setA] = useState("15"); const [b, setB] = useState("200");
  const out = useMemo(() => { const x = parseFloat(a), y = parseFloat(b); if (Number.isNaN(x) || Number.isNaN(y)) return { v: "—", detail: "Enter both numbers." };
    try { if (mode === "of") return { v: fmt(pctOf(x, y), 4), detail: `${x}% of ${y}` }; if (mode === "change") { const c = pctChange(x, y); return { v: `${c >= 0 ? "+" : ""}${fmt(c)}%`, detail: c >= 0 ? "Increase" : "Decrease" }; } return { v: `${fmt(pctDifference(x, y))}%`, detail: "Difference relative to the average" }; }
    catch (e) { return { v: "—", detail: e instanceof Error ? e.message : "Error" }; } }, [mode, a, b]);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Calculation type">
        {[["of", "X% of Y"], ["change", "Percentage change"], ["difference", "Percentage difference"]].map(([m, l]) => (
          <button key={m} className="chip" aria-pressed={mode === m} onClick={() => setMode(m)}>{l}</button>))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={mode === "of" ? "Percentage (%)" : "First value"}><input className="input" type="number" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label={mode === "of" ? "Of number" : "Second value"}><input className="input" type="number" value={b} onChange={(e) => setB(e.target.value)} /></Field>
      </div>
      <div className="output-box mt-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm muted">{out.detail}</p><p className="text-3xl font-extrabold">{out.v}</p></div><CopyButton text={out.v} /></div>
    </div>
  );
}

export function UnitConverterTool() {
  const [cat, setCat] = useState<UnitCategory>("length"); const [val, setVal] = useState("1"); const [from, setFrom] = useState("m"); const [to, setTo] = useState("ft");
  const setCategory = (c: UnitCategory) => { setCat(c); setFrom(UNITS[c][2]?.unit || UNITS[c][0].unit); setTo(UNITS[c][1]?.unit || UNITS[c][0].unit); if (c === "temperature") { setFrom("C"); setTo("F"); } };
  const out = useMemo(() => { const v = parseFloat(val); if (Number.isNaN(v)) return "—"; try { return fmt(convertUnit(cat, v, from, to), 6); } catch { return "—"; } }, [cat, val, from, to]);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">{(Object.keys(UNITS) as UnitCategory[]).map((c) => <button key={c} className="chip capitalize" aria-pressed={cat === c} onClick={() => setCategory(c)}>{c === "data" ? "Data storage" : c}</button>)}</div>
      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <Field label="From"><div className="flex gap-2"><input className="input" type="number" value={val} onChange={(e) => setVal(e.target.value)} aria-label="Value to convert" />
          <select className="input !w-auto" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Source unit">{UNITS[cat].map((u) => <option key={u.unit} value={u.unit}>{u.label}</option>)}</select></div></Field>
        <button className="btn-ghost btn-sm mb-0.5" aria-label="Swap units" onClick={() => { setFrom(to); setTo(from); }}>⇄ Swap</button>
        <Field label="To"><select className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Target unit">{UNITS[cat].map((u) => <option key={u.unit} value={u.unit}>{u.label}</option>)}</select></Field>
      </div>
      <div className="output-box mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xl font-bold">{val || "0"} {from} = <span style={{ color: "var(--primary)" }}>{out} {to}</span></p><CopyButton text={`${out} ${to}`} /></div>
      <p className="hint">Temperature uses the correct °C/°F/K formulas (not simple multiplication). Data uses binary units (1 KB = 1024 B).</p>
    </div>
  );
}

export function AgeTool() {
  const [dob, setDob] = useState("");
  const { out, err } = useMemo(() => { if (!dob) return { out: null, err: "" }; try { return { out: ageFromDob(new Date(dob + "T00:00:00")), err: "" }; } catch (e) { return { out: null, err: e instanceof Error ? e.message : "Invalid date" }; } }, [dob]);
  return (
    <div>
      <div className="max-w-sm"><Field label="Date of birth"><input className="input" type="date" max={todayISO()} value={dob} onChange={(e) => setDob(e.target.value)} /></Field></div>
      <div className="mt-4"><ErrorBox msg={dob ? err : ""} /></div>
      {out ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        <ResultStat label="Years" value={String(out.years)} /><ResultStat label="Months" value={String(out.months)} /><ResultStat label="Days" value={String(out.days)} />
        <ResultStat label="Total days" value={fmt(out.totalDays, 0)} /><ResultStat label="Total weeks" value={fmt(out.totalWeeks, 0)} /><ResultStat label="Total months" value={fmt(out.totalMonths, 0)} />
      </div> : <p className="hint mt-3">Pick a birth date to see the exact age. Future dates are rejected.</p>}
    </div>
  );
}

export function DateDiffTool() {
  const [a, setA] = useState(todayISO()); const [b, setB] = useState(todayISO());
  const { out, err } = useMemo(() => {
    if (!a || !b) return { out: null, err: "" };
    try { return { out: dateDiff(new Date(a + "T00:00:00"), new Date(b + "T00:00:00")), err: "" }; }
    catch (e) { return { out: null, err: e instanceof Error ? e.message : "Invalid date" }; }
  }, [a, b]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
        <Field label="Start date"><input className="input" type="date" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="End date"><input className="input" type="date" value={b} onChange={(e) => setB(e.target.value)} /></Field>
      </div>
      <div className="mt-4"><ErrorBox msg={err} /></div>
      {out && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <ResultStat label="Total days" value={fmt(out.days, 0)} /><ResultStat label="Breakdown" value={`${out.years}y ${out.months}m ${out.remDays}d`} />
        <ResultStat label="Weeks + days" value={`${out.weeks}w ${out.remainingDays}d`} /><ResultStat label="Business days" value={fmt(out.businessDays, 0)} />
      </div>}
      <p className="hint mt-3">Order doesn&apos;t matter — dates are sorted automatically. Day count is the number of midnights between the dates.</p>
    </div>
  );
}

export function CountdownTool() {
  const [target, setTarget] = useState(""); const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!target) return; const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, [target]);
  const diff = target ? new Date(target).getTime() - now : 0;
  const expired = target !== "" && diff <= 0;
  const parts = useMemo(() => { const s = Math.max(0, Math.floor(diff / 1000)); return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 }; }, [diff]);
  return (
    <div>
      <div className="max-w-md"><Field label="Target date & time" hint="Stored only in this page — timers clean up automatically."><input className="input" type="datetime-local" value={target} onChange={(e) => setTarget(e.target.value)} /></Field></div>
      {!target && <p className="hint mt-3">Choose a future moment to start the live countdown.</p>}
      {target && (expired
        ? <div className="output-box mt-5 text-center"><p className="text-2xl font-extrabold" style={{ color: "var(--error)" }}>Time&apos;s up!</p><p className="muted text-sm mt-1">The target moment has passed.</p></div>
        : <div className="grid grid-cols-4 gap-3 mt-5 max-w-lg" aria-live="polite">
            <ResultStat label="Days" value={String(parts.d)} /><ResultStat label="Hours" value={String(parts.h).padStart(2, "0")} />
            <ResultStat label="Minutes" value={String(parts.m).padStart(2, "0")} /><ResultStat label="Seconds" value={String(parts.s).padStart(2, "0")} />
          </div>)}
    </div>
  );
}
