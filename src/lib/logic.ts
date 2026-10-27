// Pure, testable logic for ToolHub tools. No DOM, no eval().

/* ---------- Calculator: tokenizer + shunting-yard ---------- */
export function evaluateExpression(input: string): number {
  const tokens: (number | string)[] = [];
  let i = 0; const s = input.replace(/\s+/g, "");
  if (!s) throw new Error("Enter an expression");
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) { let n = ""; while (i < s.length && /[0-9.]/.test(s[i])) n += s[i++]; const v = Number(n); if (Number.isNaN(v)) throw new Error("Invalid number"); tokens.push(v); continue; }
    if ("+-*/%()".includes(c)) { tokens.push(c); i++; continue; }
    throw new Error(`Invalid character: ${c}`);
  }
  // Normalize leading signs as real unary operators. Treating `-` as `0 -`
  // breaks precedence in expressions such as 2*-3 and -(2+3).
  const norm: (number | string)[] = [];
  tokens.forEach((tok, idx) => {
    const previous = tokens[idx - 1];
    const unary = (tok === "-" || tok === "+") && (idx === 0 || previous === "(" || typeof previous === "string" && "+-*/%".includes(previous));
    norm.push(unary ? `u${tok}` : tok);
  });
  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "u+": 3, "u-": 3 };
  const out: (number | string)[] = []; const ops: string[] = [];
  for (const tok of norm) {
    if (typeof tok === "number") out.push(tok);
    else if (tok === "(") ops.push(tok);
    else if (tok === ")") { while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop()!); if (!ops.length) throw new Error("Mismatched parentheses"); ops.pop(); }
    else {
      const rightAssociative = tok === "u+" || tok === "u-";
      while (ops.length && ops[ops.length - 1] !== "(" && (prec[ops[ops.length - 1]] > prec[tok] || (!rightAssociative && prec[ops[ops.length - 1]] === prec[tok]))) out.push(ops.pop()!);
      ops.push(tok);
    }
  }
  while (ops.length) { const op = ops.pop()!; if (op === "(") throw new Error("Mismatched parentheses"); out.push(op); }
  const stack: number[] = [];
  for (const tok of out) {
    if (typeof tok === "number") stack.push(tok);
    else if (tok === "u+" || tok === "u-") { const value = stack.pop(); if (value === undefined) throw new Error("Invalid expression"); stack.push(tok === "u-" ? -value : value); }
    else { const b = stack.pop(), a = stack.pop(); if (a === undefined || b === undefined) throw new Error("Invalid expression");
      if (tok === "+") stack.push(a + b); else if (tok === "-") stack.push(a - b); else if (tok === "*") stack.push(a * b);
      else if (tok === "/") { if (b === 0) throw new Error("Division by zero"); stack.push(a / b); }
      else if (tok === "%") { if (b === 0) throw new Error("Division by zero"); stack.push(a % b); } }
  }
  if (stack.length !== 1 || !Number.isFinite(stack[0])) throw new Error("Invalid expression");
  return Math.round(stack[0] * 1e12) / 1e12;
}

/* ---------- Percentage ---------- */
export const pctOf = (p: number, n: number) => (p / 100) * n;
export const pctChange = (from: number, to: number) => { if (from === 0) throw new Error("Original value cannot be zero"); return ((to - from) / Math.abs(from)) * 100; };
export const pctDifference = (a: number, b: number) => { const avg = (Math.abs(a) + Math.abs(b)) / 2; if (avg === 0) return 0; return (Math.abs(a - b) / avg) * 100; };

/* ---------- Units ---------- */
export type UnitCategory = "length" | "mass" | "temperature" | "time" | "data" | "volume";
export const UNITS: Record<UnitCategory, { unit: string; label: string; toBase: number }[]> = {
  length: [{ unit: "mm", label: "Millimeters", toBase: 0.001 }, { unit: "cm", label: "Centimeters", toBase: 0.01 }, { unit: "m", label: "Meters", toBase: 1 }, { unit: "km", label: "Kilometers", toBase: 1000 }, { unit: "in", label: "Inches", toBase: 0.0254 }, { unit: "ft", label: "Feet", toBase: 0.3048 }, { unit: "yd", label: "Yards", toBase: 0.9144 }, { unit: "mi", label: "Miles", toBase: 1609.344 }],
  mass: [{ unit: "mg", label: "Milligrams", toBase: 0.001 }, { unit: "g", label: "Grams", toBase: 1 }, { unit: "kg", label: "Kilograms", toBase: 1000 }, { unit: "oz", label: "Ounces", toBase: 28.349523125 }, { unit: "lb", label: "Pounds", toBase: 453.59237 }, { unit: "t", label: "Metric tonnes", toBase: 1_000_000 }],
  temperature: [{ unit: "C", label: "Celsius (°C)", toBase: 1 }, { unit: "F", label: "Fahrenheit (°F)", toBase: 1 }, { unit: "K", label: "Kelvin (K)", toBase: 1 }],
  time: [{ unit: "ms", label: "Milliseconds", toBase: 0.001 }, { unit: "s", label: "Seconds", toBase: 1 }, { unit: "min", label: "Minutes", toBase: 60 }, { unit: "h", label: "Hours", toBase: 3600 }, { unit: "d", label: "Days", toBase: 86400 }, { unit: "wk", label: "Weeks", toBase: 604800 }],
  data: [{ unit: "B", label: "Bytes", toBase: 1 }, { unit: "KB", label: "Kilobytes", toBase: 1024 }, { unit: "MB", label: "Megabytes", toBase: 1024 ** 2 }, { unit: "GB", label: "Gigabytes", toBase: 1024 ** 3 }, { unit: "TB", label: "Terabytes", toBase: 1024 ** 4 }, { unit: "bit", label: "Bits", toBase: 0.125 }],
  volume: [{ unit: "ml", label: "Milliliters", toBase: 0.001 }, { unit: "l", label: "Liters", toBase: 1 }, { unit: "gal", label: "US gallons", toBase: 3.785411784 }, { unit: "cup", label: "US cups", toBase: 0.2365882365 }, { unit: "floz", label: "US fluid ounces", toBase: 0.0295735295625 }],
};
export function convertUnit(cat: UnitCategory, value: number, from: string, to: string): number {
  if (cat === "temperature") {
    let c: number;
    if (from === "C") c = value; else if (from === "F") c = (value - 32) * 5 / 9; else c = value - 273.15;
    if (to === "C") return c; if (to === "F") return c * 9 / 5 + 32; return c + 273.15;
  }
  const list = UNITS[cat]; const f = list.find((u) => u.unit === from), tt = list.find((u) => u.unit === to);
  if (!f || !tt) throw new Error("Unknown unit");
  return (value * f.toBase) / tt.toBase;
}

/* ---------- Dates ---------- */
export function ageFromDob(dob: Date, now = new Date()) {
  if (Number.isNaN(dob.getTime())) throw new Error("Invalid date of birth");
  if (Number.isNaN(now.getTime())) throw new Error("Invalid current date");
  if (dob > now) throw new Error("Date of birth is in the future");
  let y = now.getFullYear() - dob.getFullYear(), m = now.getMonth() - dob.getMonth(), d = now.getDate() - dob.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  const totalDays = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(dob.getFullYear(), dob.getMonth(), dob.getDate())) / 86400000);
  return { years: y, months: m, days: d, totalDays, totalWeeks: Math.floor(totalDays / 7), totalMonths: y * 12 + m };
}
export function dateDiff(a: Date, b: Date) {
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) throw new Error("Invalid dates");
  const start = a <= b ? a : b, end = a <= b ? b : a;
  const days = Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000);
  let y = end.getFullYear() - start.getFullYear(), m = end.getMonth() - start.getMonth(), d = end.getDate() - start.getDate();
  if (d < 0) { m--; d += new Date(end.getFullYear(), end.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  let business = 0; const cur = new Date(start);
  for (let i = 0; i < days; i++) { cur.setDate(cur.getDate() + 1); const dow = cur.getDay(); if (dow !== 0 && dow !== 6) business++; }
  return { days, weeks: Math.floor(days / 7), remainingDays: days % 7, years: y, months: m, remDays: d, businessDays: business, hours: days * 24 };
}

/* ---------- Text ---------- */
export function textStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, chars: text.length, charsNoSpaces: text.replace(/\s/g, "").length,
    lines: text ? text.split(/\r\n|\r|\n/).length : 0,
    paragraphs: text.trim() ? text.split(/\n\s*\n/).filter(Boolean).length : 0,
    sentences: text.trim() ? (text.match(/[.!?]+(\s|$)/g)?.length ?? 0) : 0,
    readingMinutes: words / 200, speakingMinutes: words / 130 };
}
export function convertCase(text: string, mode: string): string {
  const words = text.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean);
  switch (mode) {
    case "upper": return text.toUpperCase();
    case "lower": return text.toLowerCase();
    case "title": return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    case "sentence": return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    case "camel": return words.map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join("");
    case "pascal": return words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
    case "snake": return words.join("_");
    case "kebab": return words.join("-");
    case "constant": return words.join("_").toUpperCase();
    default: return text;
  }
}
const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum perspiciatis unde omnis iste natus error voluptatem accusantium doloremque laudantium".split(" ");
export function lorem(kind: "words" | "sentences" | "paragraphs", count: number, rand: () => number = Math.random): string {
  const pick = () => LOREM_WORDS[Math.floor(rand() * LOREM_WORDS.length)];
  const sentence = () => { const n = 6 + Math.floor(rand() * 10); const s = Array.from({ length: n }, pick).join(" "); return s[0].toUpperCase() + s.slice(1) + "."; };
  if (kind === "words") { const w = ["Lorem", "ipsum", ...Array.from({ length: Math.max(0, count - 2) }, pick)]; return w.slice(0, count).join(" "); }
  if (kind === "sentences") return Array.from({ length: count }, sentence).join(" ");
  return Array.from({ length: count }, () => Array.from({ length: 3 + Math.floor(rand() * 3) }, sentence).join(" ")).join("\n\n");
}
export function cleanWhitespace(text: string, opts: { trim: boolean; collapseSpaces: boolean; collapseLines: boolean; trimLines: boolean; removeBlank: boolean }): string {
  let out = text;
  if (opts.trimLines) out = out.split("\n").map((l) => l.trim()).join("\n");
  if (opts.collapseSpaces) out = out.replace(/[ \t]+/g, " ");
  if (opts.removeBlank) out = out.split("\n").filter((l) => l.trim() !== "").join("\n");
  else if (opts.collapseLines) out = out.replace(/\n{3,}/g, "\n\n");
  if (opts.trim) out = out.trim();
  return out;
}
export type DiffLine = { type: "same" | "add" | "remove"; text: string };
export function diffLines(a: string, b: string): DiffLine[] {
  const A = a.split("\n"), B = b.split("\n");
  if (A.length * B.length > 250000) { // large input guard: simple set-based fallback
    const setB = new Set(B), setA = new Set(A);
    return [...A.filter((x) => !setB.has(x)).map((text) => ({ type: "remove" as const, text })), ...B.filter((x) => !setA.has(x)).map((text) => ({ type: "add" as const, text }))];
  }
  const dp: number[][] = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffLine[] = []; let i = 0, j = 0;
  while (i < A.length && j < B.length) { if (A[i] === B[j]) { out.push({ type: "same", text: A[i] }); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: "remove", text: A[i] }); i++; } else { out.push({ type: "add", text: B[j] }); j++; } }
  while (i < A.length) out.push({ type: "remove", text: A[i++] });
  while (j < B.length) out.push({ type: "add", text: B[j++] });
  return out;
}

/* ---------- Dev ---------- */
export function formatJson(input: string, indent = 2): { ok: true; output: string } | { ok: false; error: string } {
  try { const v = JSON.parse(input); return { ok: true, output: indent === 0 ? JSON.stringify(v) : JSON.stringify(v, null, indent) }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" }; }
}
export function base64EncodeUnicode(str: string): string {
  const bytes = new TextEncoder().encode(str); let bin = ""; bytes.forEach((b) => bin += String.fromCharCode(b)); return btoa(bin);
}
export function base64DecodeUnicode(b64: string): string {
  const clean = b64.trim().replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) throw new Error("Malformed Base64 input");
  const bin = atob(clean); const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
export function uuidv4(): string {
  const b = new Uint8Array(16); crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
/* Color */
export function hexToRgb(hex: string) { const m = hex.trim().replace(/^#/, ""); if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(m)) throw new Error("Enter a valid HEX color like #2563EB"); const f = m.length === 3 ? m.split("").map((c) => c + c).join("") : m; return { r: parseInt(f.slice(0, 2), 16), g: parseInt(f.slice(2, 4), 16), b: parseInt(f.slice(4, 6), 16) }; }
export const rgbToHex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
export function rgbToHsl(r: number, g: number, b: number) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2; if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; } return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }; }
export function hslToRgb(h: number, s: number, l: number) { s /= 100; l /= 100; const k = (n: number) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l); const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) }; }
export function palette(hex: string, mode: "complementary" | "analogous" | "triadic" | "monochromatic"): string[] {
  const { r, g, b } = hexToRgb(hex); const { h, s, l } = rgbToHsl(r, g, b);
  const toHex = (hh: number, ss: number, ll: number) => { const c = hslToRgb(((hh % 360) + 360) % 360, Math.max(0, Math.min(100, ss)), Math.max(0, Math.min(100, ll))); return rgbToHex(c.r, c.g, c.b); };
  if (mode === "complementary") return [toHex(h, s, l), toHex(h + 180, s, l), toHex(h, s, Math.min(90, l + 22)), toHex(h + 180, s, Math.max(10, l - 18)), toHex(h, Math.max(10, s - 30), l)];
  if (mode === "analogous") return [-40, -20, 0, 20, 40].map((d) => toHex(h + d, s, l));
  if (mode === "triadic") return [toHex(h, s, l), toHex(h + 120, s, l), toHex(h + 240, s, l), toHex(h, s, Math.min(90, l + 22)), toHex(h + 120, s, Math.max(10, l - 15))];
  return [18, 36, 52, 68, 84].map((ll) => toHex(h, s, ll));
}
/* Passwords */
const SETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{};:,.<>?" };
export function generatePassword(len: number, opts: { lower: boolean; upper: boolean; digits: boolean; symbols: boolean; excludeAmbiguous: boolean }): string {
  let pool = ""; const chosen: string[] = [];
  (Object.keys(SETS) as (keyof typeof SETS)[]).forEach((k) => { if (opts[k]) { let set = SETS[k]; if (opts.excludeAmbiguous) set = set.replace(/[Il1O0]/g, ""); pool += set; chosen.push(set); } });
  if (!pool) throw new Error("Select at least one character set");
  const rnd = (max: number) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % max; };
  const chars = chosen.map((s) => s[rnd(s.length)]);
  while (chars.length < len) chars.push(pool[rnd(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.slice(0, len).join("");
}
export function passwordStrength(pw: string) {
  if (!pw) return { score: 0, label: "Empty", entropy: 0, feedback: ["Enter a password to estimate its strength."] };
  let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/[0-9]/.test(pw)) pool += 10; if (/[^a-zA-Z0-9]/.test(pw)) pool += 33; if (/\s/.test(pw)) pool += 1;
  let entropy = pool ? pw.length * Math.log2(pool) : 0;
  const feedback: string[] = [];
  if (/(.)\1{2,}/.test(pw)) { entropy *= 0.75; feedback.push("Avoid repeated characters."); }
  if (/^(password|qwerty|letmein|123456|admin)/i.test(pw)) { entropy = Math.min(entropy, 12); feedback.push("This looks like a common password pattern."); }
  if (pw.length < 12) feedback.push("Use at least 12 characters.");
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) feedback.push("Mix upper and lower case.");
  if (!/[0-9]/.test(pw)) feedback.push("Add numbers.");
  if (!/[^a-zA-Z0-9]/.test(pw)) feedback.push("Add symbols for more entropy.");
  if (!feedback.length) feedback.push("Strong structure. Still use a unique password per site and a password manager.");
  const score = entropy < 28 ? 1 : entropy < 40 ? 2 : entropy < 60 ? 3 : entropy < 85 ? 4 : 5;
  return { score, label: ["", "Very weak", "Weak", "Fair", "Strong", "Excellent"][score], entropy: Math.round(entropy), feedback };
}
/* Finance */
export function emi(principal: number, annualRate: number, months: number) {
  if (!Number.isFinite(principal)) throw new Error("Principal must be a finite number");
  if (!Number.isFinite(annualRate)) throw new Error("Interest rate must be a finite number");
  if (!Number.isFinite(months) || !Number.isInteger(months)) throw new Error("Duration must be a whole number of months");
  if (principal < 0) throw new Error("Principal cannot be negative");
  if (annualRate < 0) throw new Error("Interest rate cannot be negative");
  if (months <= 0) throw new Error("Duration must be at least 1 month");
  const r = annualRate / 1200;
  const monthly = r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const total = monthly * months;
  if (![monthly, total].every(Number.isFinite)) throw new Error("Loan values are too large to calculate");
  return { monthly, total, interest: total - principal };
}
export function tipCalc(bill: number, tipPct: number, people: number) {
  if (!Number.isFinite(bill)) throw new Error("Bill amount must be a finite number");
  if (!Number.isFinite(tipPct)) throw new Error("Tip percentage must be a finite number");
  if (!Number.isFinite(people) || !Number.isInteger(people)) throw new Error("People must be a whole number");
  if (bill < 0) throw new Error("Bill amount cannot be negative");
  if (tipPct < 0) throw new Error("Tip percentage cannot be negative");
  if (people < 0) throw new Error("People cannot be negative");
  const tip = bill * tipPct / 100, total = bill + tip, ppl = Math.max(1, people);
  return { tip, total, perPerson: total / ppl, tipPerPerson: tip / ppl };
}
export const fmt = (n: number, digits = 2) => n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
export function validateImageFile(file: File, maxMB = 15): string | null {
  if (!file.type.startsWith("image/")) return "That file is not an image.";
  if (file.size > maxMB * 1024 * 1024) return `File is larger than ${maxMB} MB.`;
  return null;
}
export const formatBytes = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;
