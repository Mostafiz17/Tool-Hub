import { NextResponse } from "next/server";

// Live rates from the free, keyless open.er-api.com service, cached server-side for 10 min.
// If the provider is unreachable we return an honest error — rates are never invented.
const cache = new Map<string, { rates: Record<string, number>; updated: string; at: number }>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = (searchParams.get("from") || "USD").toUpperCase();
  const to = (searchParams.get("to") || "EUR").toUpperCase();
  const amount = Number(searchParams.get("amount") || "1");
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) || Number.isNaN(amount) || amount < 0)
    return NextResponse.json({ error: "Invalid currency code or amount." }, { status: 400 });
  try {
    let entry = cache.get(from);
    if (!entry || Date.now() - entry.at > 10 * 60 * 1000) {
      const r = await fetch(`https://open.er-api.com/v6/latest/${from}`, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error("provider error");
      const d = await r.json();
      if (d.result !== "success" || !d.rates) throw new Error("provider error");
      entry = { rates: d.rates, updated: d.time_last_update_utc || new Date().toUTCString(), at: Date.now() };
      cache.set(from, entry);
    }
    const rate = entry.rates[to];
    if (!rate) return NextResponse.json({ error: `Rate not available for ${to}.` }, { status: 422 });
    return NextResponse.json({ from, to, amount, rate, result: amount * rate, updated: entry.updated, source: "open.er-api.com (ExchangeRate-API open access)" });
  } catch {
    return NextResponse.json({ error: "Live exchange-rate service is unreachable right now. Please try again later — we don't display made-up rates." }, { status: 502 });
  }
}
