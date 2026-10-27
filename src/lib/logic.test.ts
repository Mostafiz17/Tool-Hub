import { describe, expect, it } from "vitest";
import { ageFromDob, base64DecodeUnicode, base64EncodeUnicode, convertCase, convertUnit, dateDiff, diffLines, emi, evaluateExpression, formatJson, hexToRgb, hslToRgb, palette, passwordStrength, pctChange, rgbToHex, rgbToHsl, textStats, tipCalc, uuidv4 } from "./logic";
import { publishedTools, searchTools, TOOLS } from "./registry";
import { inpaintMaskedPixels } from "./inpaint";

describe("calculator", () => {
  it("evaluates safely with precedence and parentheses", () => {
    expect(evaluateExpression("2+3*4")).toBe(14);
    expect(evaluateExpression("(2+3)*4")).toBe(20);
    expect(evaluateExpression("-5+3")).toBe(-2);
    expect(evaluateExpression("10/4")).toBe(2.5);
  });
  it("handles unary signs without changing binary operator precedence", () => {
    expect(evaluateExpression("2*-3")).toBe(-6);
    expect(evaluateExpression("2/-4")).toBe(-0.5);
    expect(evaluateExpression("-(2+3)")).toBe(-5);
    expect(evaluateExpression("--3")).toBe(3);
    expect(evaluateExpression("2--3")).toBe(5);
  });
  it("rejects division by zero and invalid input", () => {
    expect(() => evaluateExpression("1/0")).toThrow(/zero/i);
    expect(() => evaluateExpression("2+a")).toThrow();
    expect(() => evaluateExpression("(2+3")).toThrow();
  });
});
describe("percentages & finance", () => {
  it("pct change", () => { expect(pctChange(100, 125)).toBe(25); expect(pctChange(200, 150)).toBe(-25); });
  it("emi handles zero interest", () => { const r = emi(12000, 0, 12); expect(r.monthly).toBe(1000); expect(r.interest).toBe(0); });
  it("emi with interest", () => { const r = emi(100000, 10, 12); expect(r.monthly).toBeGreaterThan(8700); expect(r.monthly).toBeLessThan(8850); });
  it("tip split", () => { const r = tipCalc(100, 20, 4); expect(r.tip).toBe(20); expect(r.perPerson).toBe(30); });
  it("rejects negative and non-finite financial inputs", () => {
    expect(() => tipCalc(-100, 20, 2)).toThrow(/bill/i);
    expect(() => tipCalc(100, -20, 2)).toThrow(/tip/i);
    expect(() => tipCalc(100, 20, -2)).toThrow(/people/i);
    expect(() => tipCalc(Number.POSITIVE_INFINITY, 20, 2)).toThrow(/finite/i);
    expect(() => emi(-1000, 5, 12)).toThrow(/principal/i);
    expect(() => emi(1000, -5, 12)).toThrow(/interest/i);
    expect(() => emi(1000, 5, 12.5)).toThrow(/whole number/i);
  });
});
describe("units", () => {
  it("linear conversions", () => { expect(convertUnit("length", 1, "km", "m")).toBe(1000); expect(convertUnit("length", 12, "in", "ft")).toBeCloseTo(1); });
  it("temperature uses formulas", () => { expect(convertUnit("temperature", 100, "C", "F")).toBe(212); expect(convertUnit("temperature", 32, "F", "C")).toBe(0); expect(convertUnit("temperature", 0, "C", "K")).toBeCloseTo(273.15); });
});
describe("dates", () => {
  it("age with leap years", () => { const a = ageFromDob(new Date("2000-02-29T00:00:00"), new Date("2024-02-28T00:00:00")); expect(a.years).toBe(23); });
  it("rejects future dob", () => { expect(() => ageFromDob(new Date("2999-01-01"))).toThrow(/future/); });
  it("rejects invalid dates before doing calendar arithmetic", () => {
    expect(() => ageFromDob(new Date("invalid"), new Date("2026-01-01"))).toThrow(/invalid/i);
    expect(() => ageFromDob(new Date("2000-01-01"), new Date("invalid"))).toThrow(/invalid/i);
    expect(() => dateDiff(new Date("invalid"), new Date("2024-01-01"))).toThrow(/valid dates/i);
    expect(() => dateDiff(new Date("2024-01-01"), new Date("invalid"))).toThrow(/valid dates/i);
  });
  it("date diff sorts dates", () => { const d = dateDiff(new Date("2024-01-10"), new Date("2024-01-01")); expect(d.days).toBe(9); });
});
describe("text", () => {
  it("stats", () => { const s = textStats("Hello world.\n\nNew para here"); expect(s.words).toBe(5); expect(s.paragraphs).toBe(2); });
  it("cases", () => { expect(convertCase("hello brave world", "camel")).toBe("helloBraveWorld"); expect(convertCase("hello brave world", "snake")).toBe("hello_brave_world"); expect(convertCase("hello brave", "title")).toBe("Hello Brave"); });
  it("diff detects add/remove", () => { const d = diffLines("a\nb", "a\nc"); expect(d.filter((x) => x.type === "add")).toHaveLength(1); expect(d.filter((x) => x.type === "remove")).toHaveLength(1); });
});
describe("dev tools", () => {
  it("json format + error", () => { expect(formatJson('{"a":1}').ok).toBe(true); expect(formatJson('{bad').ok).toBe(false); });
  it("unicode base64 round-trip", () => { const s = "Hello, 世界! 👋"; expect(base64DecodeUnicode(base64EncodeUnicode(s))).toBe(s); });
  it("rejects malformed base64", () => { expect(() => base64DecodeUnicode("!!!not-base64!!!")).toThrow(); });
  it("uuid v4 shape", () => { expect(uuidv4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/); });
  it("color conversions round-trip (within HSL rounding)", () => { const orig = hexToRgb("#2563EB"); const hsl = rgbToHsl(orig.r, orig.g, orig.b); const back = hslToRgb(hsl.h, hsl.s, hsl.l); expect(Math.abs(back.r - orig.r)).toBeLessThanOrEqual(2); expect(Math.abs(back.g - orig.g)).toBeLessThanOrEqual(2); expect(Math.abs(back.b - orig.b)).toBeLessThanOrEqual(2); expect(rgbToHex(255, 0, 0)).toBe("#FF0000"); });
  it("palette uses real harmony", () => { const p = palette("#FF0000", "complementary"); expect(p).toContain("#00FFFF"); expect(palette("#FF0000", "analogous")).toHaveLength(5); });
  it("password strength ranks weak vs strong", () => { expect(passwordStrength("password").score).toBeLessThan(passwordStrength("X9!vQ2#mZ8$pL4&").score); });
});
describe("local image healing", () => {
  it("reconstructs selected pixels from surrounding colour and leaves unselected pixels unchanged", async () => {
    const width = 5, height = 5;
    const source = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      source.set([80, 120, 160, 255], i * 4);
    }
    // Simulate a dark mark on a flat background.
    source.set([0, 0, 0, 255], (2 * width + 2) * 4);
    const mask = new Uint8Array(width * height);
    mask[2 * width + 2] = 1;
    const result = await inpaintMaskedPixels(width, height, source, mask);
    expect(result[(2 * width + 2) * 4]).toBe(80);
    expect(result[(2 * width + 2) * 4 + 1]).toBe(120);
    expect(result[0]).toBe(80);
    expect(result[3]).toBe(255);
    expect(source[(2 * width + 2) * 4]).toBe(0); // source is not mutated
  });
  it("returns a copy when no pixels are selected", async () => {
    const source = new Uint8ClampedArray([10, 20, 30, 255]);
    const result = await inpaintMaskedPixels(1, 1, source, new Uint8Array([0]));
    expect(result).not.toBe(source);
    expect([...result]).toEqual([...source]);
  });
  it("rejects a selection with no surrounding source pixels", async () => {
    await expect(inpaintMaskedPixels(2, 2, new Uint8ClampedArray(16), new Uint8Array([1, 1, 1, 1]))).rejects.toThrow(/unpainted image/i);
  });
});
describe("registry", () => {
  it("has 31 published unique tools", () => {
    expect(publishedTools).toHaveLength(31);
    expect(new Set(TOOLS.map((t) => t.slug)).size).toBe(31);
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(31);
  });
  it("search + category filtering", () => {
    expect(searchTools("json").map((t) => t.slug)).toContain("json-formatter");
    expect(searchTools("watermark").map((t) => t.slug)).toContain("watermark-remover");
    expect(searchTools("zzz-no-match-zzz")).toHaveLength(0);
    expect(publishedTools.filter((t) => t.category === "image")).toHaveLength(5);
  });
});
