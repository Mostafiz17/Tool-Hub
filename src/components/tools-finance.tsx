"use client";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { emi, fmt, tipCalc } from "@/lib/logic";
import { CopyButton, DownloadButton, ErrorBox, Field, ResultStat } from "./ui";

export function TipTool() {
  const [bill, setBill] = useState("85"); const [tip, setTip] = useState(18); const [people, setPeople] = useState(2);
  const { out, err } = useMemo(() => {
    try { return { out: tipCalc(parseFloat(bill) || 0, tip, people), err: "" }; }
    catch (e) { return { out: null, err: e instanceof Error ? e.message : "Invalid input" }; }
  }, [bill, tip, people]);
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Bill amount"><input className="input" type="number" min={0} step="0.01" value={bill} onChange={(e) => setBill(e.target.value)} /></Field>
        <Field label={`Tip: ${tip}%`}><input type="range" min={0} max={50} value={tip} onChange={(e) => setTip(Number(e.target.value))} className="w-full mt-3" aria-label="Tip percentage" /></Field>
        <Field label="Split between (people)"><input className="input" type="number" min={1} max={50} value={people} onChange={(e) => setPeople(Number(e.target.value))} /></Field>
      </div>
      <div className="flex gap-2 mt-3">{[10, 15, 18, 20, 25].map((p) => <button key={p} className="chip" aria-pressed={tip === p} onClick={() => setTip(p)}>{p}%</button>)}</div>
      <div className="mt-3"><ErrorBox msg={err} /></div>
      {out && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <ResultStat label="Tip amount" value={fmt(out.tip)} /><ResultStat label="Total bill" value={fmt(out.total)} />
        <ResultStat label="Per person" value={fmt(out.perPerson)} /><ResultStat label="Tip per person" value={fmt(out.tipPerPerson)} />
      </div>}
    </div>
  );
}

export function EmiTool() {
  const [p, setP] = useState("25000"); const [rate, setRate] = useState("7.5"); const [years, setYears] = useState("5");
  const { out, err } = useMemo(() => { try { return { out: emi(parseFloat(p) || 0, parseFloat(rate) || 0, Math.round((parseFloat(years) || 0) * 12)), err: "" }; } catch (e) { return { out: null, err: e instanceof Error ? e.message : "Invalid input" }; } }, [p, rate, years]);
  const months = Math.round((parseFloat(years) || 0) * 12);
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Loan amount (principal)"><input className="input" type="number" min={0} value={p} onChange={(e) => setP(e.target.value)} /></Field>
        <Field label="Annual interest rate (%)" hint="Use 0 for interest-free loans."><input className="input" type="number" min={0} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Duration (years)"><input className="input" type="number" min={0.1} step="0.5" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
      </div>
      <div className="mt-3"><ErrorBox msg={err} /></div>
      {out && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <ResultStat label="Monthly EMI" value={fmt(out.monthly)} /><ResultStat label="Total repayment" value={fmt(out.total)} />
          <ResultStat label="Total interest" value={fmt(out.interest)} /><ResultStat label="Payments" value={`${months} months`} />
        </div>
        <p className="hint mt-3">Breakdown: principal {fmt(parseFloat(p) || 0)} + total interest {fmt(out.interest)} = {fmt(out.total)} over {months} monthly payments. Formula: EMI = P·r·(1+r)ⁿ / ((1+r)ⁿ − 1), with r = annual rate ÷ 1200.</p>
      </>}
    </div>
  );
}

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR", "AUD", "CAD", "CHF", "CNY", "PKR", "AED", "SGD", "NZD", "ZAR", "BRL", "KRW"];
export function CurrencyTool() {
  const [amount, setAmount] = useState("100"); const [from, setFrom] = useState("USD"); const [to, setTo] = useState("EUR");
  const [data, setData] = useState<{ result: number; rate: number; updated: string; source: string } | null>(null);
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => {
    const amt = parseFloat(amount);
    const id = setTimeout(() => {
      if (Number.isNaN(amt)) { setData(null); return; }
      setLoading(true);
      fetch(`/api/currency?from=${from}&to=${to}&amount=${amt}`)
        .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Rate service unavailable"); setData(d); setErr(""); })
        .catch((e) => { setData(null); setErr(e instanceof Error ? e.message : "Could not load live rates."); })
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(id);
  }, [amount, from, to]);
  return (
    <div>
      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end max-w-2xl">
        <Field label="Amount"><div className="flex gap-2"><input className="input" type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className="input !w-auto" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From currency">{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div></Field>
        <button className="btn-ghost btn-sm mb-0.5" aria-label="Swap currencies" onClick={() => { setFrom(to); setTo(from); }}>⇄ Swap</button>
        <Field label="Converted to"><select className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To currency">{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      </div>
      <div className="mt-4"><ErrorBox msg={err} /></div>
      {loading && <p className="text-sm muted mt-3">Loading live rate…</p>}
      {data && <div className="output-box mt-4">
        <p className="text-3xl font-extrabold">{fmt(parseFloat(amount) || 0, 2)} {from} = <span style={{ color: "var(--primary)" }}>{fmt(data.result, 4)} {to}</span></p>
        <p className="text-sm muted mt-2">Rate: 1 {from} = {fmt(data.rate, 6)} {to} · Source: {data.source} · Updated: {new Date(data.updated).toLocaleString()}</p>
        <div className="mt-3"><CopyButton text={`${fmt(parseFloat(amount) || 0, 2)} ${from} = ${fmt(data.result, 4)} ${to}`} /></div>
      </div>}
      <p className="hint mt-3">Rates come from the free open exchange-rate service (open.er-api.com) via our caching proxy. If it is unreachable we show an error — we never invent rates.</p>
    </div>
  );
}

export function QrTool() {
  const [text, setText] = useState("https://example.com"); const [size, setSize] = useState(320); const [url, setUrl] = useState(""); const [err, setErr] = useState("");
  useEffect(() => {
    const id = setTimeout(() => {
      if (!text.trim()) { setUrl(""); return; }
      QRCode.toDataURL(text, { width: size, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0F172A", light: "#FFFFFF" } })
        .then((u) => { setUrl(u); setErr(""); })
        .catch(() => setErr("That content is too long for a QR code — try shortening it."));
    }, 200);
    return () => clearTimeout(id);
  }, [text, size]);
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Field label="Text or URL" hint={`${text.length} characters. QR codes hold up to ~2,900 characters at this error level.`}>
          <textarea className="input" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="https://your-link.com or any text" /></Field>
        <Field label={`Image size: ${size}px`}><input type="range" min={160} max={1024} step={32} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" aria-label="QR image size" /></Field>
        <ErrorBox msg={err} />
        {url && <DownloadButton href={url} filename="toolhub-qrcode.png" label="Download PNG" />}
      </div>
      <div className="card p-6 grid place-items-center min-h-64">
        {url ? <img src={url} alt={`QR code encoding: ${text.slice(0, 60)}`} className="w-full max-w-[320px] h-auto rounded-lg" /> : <p className="muted text-sm text-center">Enter text to generate<br />your QR code preview</p>}
      </div>
    </div>
  );
}
