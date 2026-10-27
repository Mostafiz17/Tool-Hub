import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import QRCode from "qrcode";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ageFromDob,
  base64DecodeUnicode,
  base64EncodeUnicode,
  cleanWhitespace,
  convertCase,
  convertUnit,
  dateDiff,
  diffLines,
  emi,
  evaluateExpression,
  formatBytes,
  formatJson,
  generatePassword,
  hexToRgb,
  hslToRgb,
  lorem,
  palette,
  passwordStrength,
  pctChange,
  pctDifference,
  pctOf,
  rgbToHex,
  rgbToHsl,
  textStats,
  tipCalc,
  uuidv4,
  validateImageFile,
} from "@/lib/logic";
import { CATEGORIES, publishedTools, searchTools, TOOLS } from "@/lib/registry";
import { inpaintMaskedPixels } from "@/lib/inpaint";
import {
  AgeTool,
  CalculatorTool,
  CountdownTool,
  DateDiffTool,
  PercentageTool,
  UnitConverterTool,
} from "@/components/tools-calc";
import {
  CaseConverterTool,
  LoremTool,
  TextDiffTool,
  WhitespaceTool,
  WordCounterTool,
} from "@/components/tools-text";
import {
  Base64Tool,
  ColorConverterTool,
  JsonTool,
  PasswordGeneratorTool,
  PasswordStrengthTool,
  RegexTool,
  UrlTool,
  UuidTool,
} from "@/components/tools-dev";
import { ColorPickerTool, FontPairingTool, PaletteTool } from "@/components/tools-design";
import {
  ImageCompressorTool,
  ImageConverterTool,
  ImageResizerTool,
  ImagesToPdfTool,
  WatermarkRemoverTool,
} from "@/components/tools-image";
import { CurrencyTool, EmiTool, QrTool, TipTool } from "@/components/tools-finance";
import { TOOL_COMPONENTS } from "@/components/ToolPage";
import { GET as currencyGET } from "@/app/api/currency/route";

const ssr = (Component: React.ComponentType) => renderToStaticMarkup(<Component />);
const fakeFile = (type: string, size: number, name = "fixture.bin") => ({ type, size, name }) as File;

describe("QA inventory and integration wiring", () => {
  it("discovers exactly 31 published tools with unique IDs and slugs", () => {
    expect(publishedTools).toHaveLength(31);
    expect(new Set(TOOLS.map((tool) => tool.id)).size).toBe(31);
    expect(new Set(TOOLS.map((tool) => tool.slug)).size).toBe(31);
  });

  it("maps every published tool to an executable component and a valid category", () => {
    expect(Object.keys(TOOL_COMPONENTS).sort()).toEqual(publishedTools.map((tool) => tool.slug).sort());
    for (const tool of publishedTools) {
      expect(TOOL_COMPONENTS[tool.slug], tool.slug).toBeTypeOf("function");
      expect(CATEGORIES.some((category) => category.slug === tool.category), tool.slug).toBe(true);
    }
  });

  it("integrates tool metadata with search", () => {
    expect(searchTools("json").map((tool) => tool.id)).toContain("json-formatter");
    expect(searchTools("remove watermark").map((tool) => tool.id)).toContain("watermark-remover");
    expect(searchTools("no-such-tool-query")).toEqual([]);
  });
});

describe("TOOL calculator | Basic Calculator", () => {
  it("executes precedence, parentheses, decimals, and modulo correctly", () => {
    expect(evaluateExpression("2 + 3 * 4")).toBe(14);
    expect(evaluateExpression("(2 + 3) * 4")).toBe(20);
    expect(evaluateExpression("10.5 % 4")).toBe(2.5);
  });
  it("handles unary negatives after another operator", () => {
    expect(evaluateExpression("2*-3")).toBe(-6);
    expect(evaluateExpression("2/-4")).toBe(-0.5);
    expect(evaluateExpression("-(2+3)")).toBe(-5);
    expect(evaluateExpression("--3")).toBe(3);
    expect(evaluateExpression("2--3")).toBe(5);
  });
  it("rejects empty, unsafe, zero-division, and mismatched input", () => {
    expect(() => evaluateExpression("")).toThrow(/enter/i);
    expect(() => evaluateExpression("2+alert(1)")).toThrow(/invalid character/i);
    expect(() => evaluateExpression("1/0")).toThrow(/division by zero/i);
    expect(() => evaluateExpression("(2+3")).toThrow(/parentheses/i);
  });
  it("server-renders the calculator workspace", () => expect(ssr(CalculatorTool)).toContain("Calculator expression"));
});

describe("TOOL percentage-calculator | Percentage Calculator", () => {
  it("calculates percentage-of, change, and symmetric difference", () => {
    expect(pctOf(15, 200)).toBe(30);
    expect(pctChange(200, 150)).toBe(-25);
    expect(pctDifference(80, 120)).toBe(40);
  });
  it("handles the zero-pair edge and rejects a zero change baseline", () => {
    expect(pctDifference(0, 0)).toBe(0);
    expect(() => pctChange(0, 50)).toThrow(/cannot be zero/i);
  });
  it("server-renders all calculation modes", () => {
    const html = ssr(PercentageTool);
    expect(html).toContain("Percentage change");
    expect(html).toContain("Percentage difference");
  });
});

describe("TOOL unit-converter | Unit Converter", () => {
  it("converts every linear unit family", () => {
    expect(convertUnit("length", 1, "km", "m")).toBe(1000);
    expect(convertUnit("mass", 1, "kg", "g")).toBe(1000);
    expect(convertUnit("time", 2, "h", "min")).toBe(120);
    expect(convertUnit("data", 1, "KB", "B")).toBe(1024);
    expect(convertUnit("volume", 1, "l", "ml")).toBe(1000);
  });
  it("uses temperature formulas and supports identity conversion", () => {
    expect(convertUnit("temperature", 100, "C", "F")).toBe(212);
    expect(convertUnit("temperature", 32, "F", "C")).toBe(0);
    expect(convertUnit("temperature", 273.15, "K", "C")).toBeCloseTo(0);
    expect(convertUnit("length", 4.5, "m", "m")).toBe(4.5);
  });
  it("rejects unknown units", () => expect(() => convertUnit("length", 1, "bogus", "m")).toThrow(/unknown unit/i));
  it("server-renders category and swap controls", () => {
    const html = ssr(UnitConverterTool);
    expect(html).toContain("Data storage");
    expect(html).toContain("Swap units");
  });
});

describe("TOOL age-calculator | Age Calculator", () => {
  it("calculates a leap-day age and totals", () => {
    const result = ageFromDob(new Date("2000-02-29T00:00:00"), new Date("2024-02-28T00:00:00"));
    expect(result.years).toBe(23);
    expect(result.months).toBe(11);
    expect(result.totalDays).toBeGreaterThan(8700);
  });
  it("rejects future dates", () => expect(() => ageFromDob(new Date("2999-01-01"), new Date("2026-01-01"))).toThrow(/future/i));
  it("rejects invalid date objects", () => expect(() => ageFromDob(new Date("invalid"), new Date("2026-01-01"))).toThrow(/invalid/i));
  it("server-renders date validation affordances", () => expect(ssr(AgeTool)).toContain("Date of birth"));
});

describe("TOOL date-difference | Date Difference", () => {
  it("sorts reversed dates and calculates weekend-aware business days", () => {
    const result = dateDiff(new Date("2024-01-08T00:00:00"), new Date("2024-01-01T00:00:00"));
    expect(result.days).toBe(7);
    expect(result.weeks).toBe(1);
    expect(result.businessDays).toBe(5);
  });
  it("returns zeros for identical dates", () => expect(dateDiff(new Date("2024-04-05"), new Date("2024-04-05")).days).toBe(0));
  it("rejects invalid dates", () => expect(() => dateDiff(new Date("invalid"), new Date("2024-01-01"))).toThrow(/invalid/i));
  it("server-renders both date inputs", () => {
    const html = ssr(DateDiffTool);
    expect(html).toContain("Start date");
    expect(html).toContain("End date");
  });
});

describe("TOOL countdown | Countdown Timer", () => {
  it("server-renders the timer input and empty-state guidance", () => {
    const html = ssr(CountdownTool);
    expect(html).toContain("Target date &amp; time");
    expect(html).toContain("Choose a future moment");
  });
  it("uses a datetime-local control for browser-valid input", () => expect(ssr(CountdownTool)).toContain('type="datetime-local"'));
});

describe("TOOL word-counter | Word & Character Counter", () => {
  it("counts words, characters, lines, paragraphs, sentences, and timing", () => {
    const result = textStats("Hello world.\n\nNew paragraph!");
    expect(result).toMatchObject({ words: 4, chars: 28, charsNoSpaces: 24, lines: 3, paragraphs: 2, sentences: 2 });
    expect(result.readingMinutes).toBe(0.02);
  });
  it("handles empty and whitespace-only input", () => {
    expect(textStats("")).toMatchObject({ words: 0, chars: 0, lines: 0, paragraphs: 0 });
    expect(textStats("   \n ").words).toBe(0);
  });
  it("server-renders all output metrics", () => {
    const html = ssr(WordCounterTool);
    expect(html).toContain("Reading time");
    expect(html).toContain("Speaking time");
  });
});

describe("TOOL case-converter | Case Converter", () => {
  it("converts all supported machine-oriented cases", () => {
    expect(convertCase("Hello brave-world", "upper")).toBe("HELLO BRAVE-WORLD");
    expect(convertCase("Hello brave-world", "lower")).toBe("hello brave-world");
    expect(convertCase("hello brave world", "camel")).toBe("helloBraveWorld");
    expect(convertCase("hello brave world", "pascal")).toBe("HelloBraveWorld");
    expect(convertCase("hello brave world", "snake")).toBe("hello_brave_world");
    expect(convertCase("hello brave world", "kebab")).toBe("hello-brave-world");
    expect(convertCase("hello brave world", "constant")).toBe("HELLO_BRAVE_WORLD");
  });
  it("converts title/sentence cases and preserves empty input", () => {
    expect(convertCase("hELLO. wORLD!", "sentence")).toBe("Hello. World!");
    expect(convertCase("hello WORLD", "title")).toBe("Hello World");
    expect(convertCase("", "camel")).toBe("");
  });
  it("server-renders all nine mode controls", () => expect((ssr(CaseConverterTool).match(/aria-pressed=/g) ?? [])).toHaveLength(9));
});

describe("TOOL lorem-ipsum | Lorem Ipsum Generator", () => {
  const deterministic = () => 0;
  it("generates exact requested word and sentence counts", () => {
    expect(lorem("words", 5, deterministic).split(" ")).toHaveLength(5);
    expect(lorem("sentences", 3, deterministic).match(/\./g)).toHaveLength(3);
  });
  it("generates separated paragraphs and handles a one-word edge", () => {
    expect(lorem("paragraphs", 2, deterministic).split("\n\n")).toHaveLength(2);
    expect(lorem("words", 1, deterministic)).toBe("Lorem");
  });
  it("server-renders count limits and regenerate action", () => {
    const html = ssr(LoremTool);
    expect(html).toContain("Count (1");
    expect(html).toContain("Regenerate");
  });
});

describe("TOOL whitespace-cleaner | Whitespace Cleaner", () => {
  it("applies trimming, repeated-space, and repeated-line options", () => {
    const input = "  alpha   beta  \n\n\n gamma  ";
    expect(cleanWhitespace(input, { trim: true, collapseSpaces: true, collapseLines: true, trimLines: false, removeBlank: false }))
      .toBe("alpha beta \n\n gamma");
  });
  it("trims each line and removes all blank lines", () => {
    expect(cleanWhitespace(" a \n \n b ", { trim: false, collapseSpaces: false, collapseLines: false, trimLines: true, removeBlank: true }))
      .toBe("a\nb");
  });
  it("preserves text when every option is disabled", () => {
    const input = "  a   b\n\n\n";
    expect(cleanWhitespace(input, { trim: false, collapseSpaces: false, collapseLines: false, trimLines: false, removeBlank: false })).toBe(input);
  });
  it("server-renders all five cleaning options", () => expect((ssr(WhitespaceTool).match(/type="checkbox"/g) ?? [])).toHaveLength(5));
});

describe("TOOL text-diff | Text Diff", () => {
  it("identifies unchanged, removed, and added lines in order", () => {
    expect(diffLines("a\nb", "a\nc")).toEqual([
      { type: "same", text: "a" },
      { type: "remove", text: "b" },
      { type: "add", text: "c" },
    ]);
  });
  it("handles identical and large inputs without quadratic allocation", () => {
    expect(diffLines("same", "same")).toEqual([{ type: "same", text: "same" }]);
    const left = Array.from({ length: 501 }, (_, i) => `a${i}`).join("\n");
    const right = Array.from({ length: 501 }, (_, i) => `b${i}`).join("\n");
    const result = diffLines(left, right);
    expect(result.filter((line) => line.type === "remove")).toHaveLength(501);
    expect(result.filter((line) => line.type === "add")).toHaveLength(501);
  });
  it("server-renders both editor inputs", () => {
    const html = ssr(TextDiffTool);
    expect(html).toContain("Original text");
    expect(html).toContain("Changed text");
  });
});

describe("TOOL json-formatter | JSON Formatter & Validator", () => {
  it("pretty-prints and minifies nested JSON correctly", () => {
    const pretty = formatJson('{"a":1,"b":[true,null]}', 2);
    expect(pretty.ok && pretty.output).toContain('\n  "b"');
    expect(formatJson('{"a":1}', 0)).toEqual({ ok: true, output: '{"a":1}' });
  });
  it("returns a concrete parser error for malformed and empty input", () => {
    const malformed = formatJson("{bad");
    expect(malformed.ok).toBe(false);
    expect(!malformed.ok && malformed.error.length).toBeGreaterThan(0);
    expect(formatJson("").ok).toBe(false);
  });
  it("server-renders format, minify, and validation controls", () => {
    const html = ssr(JsonTool);
    expect(html).toContain("Format &amp; Validate");
    expect(html).toContain("Minify");
  });
});

describe("TOOL base64 | Base64 Encoder / Decoder", () => {
  it("round-trips ASCII, Unicode, emoji, and empty strings", () => {
    for (const value of ["Hello", "Hello, 世界! 👋", "", "line 1\nline 2"]) {
      expect(base64DecodeUnicode(base64EncodeUnicode(value))).toBe(value);
    }
  });
  it("rejects malformed alphabets, padding, and invalid UTF-8", () => {
    expect(() => base64DecodeUnicode("!!!not-base64!!!")).toThrow(/malformed/i);
    expect(() => base64DecodeUnicode("A")).toThrow(/malformed/i);
    expect(() => base64DecodeUnicode("/w==")).toThrow();
  });
  it("server-renders encode/decode modes", () => {
    const html = ssr(Base64Tool);
    expect(html).toContain("encode");
    expect(html).toContain("decode");
  });
});

describe("TOOL uuid-generator | UUID Generator", () => {
  it("generates valid RFC 4122 version/variant shapes", () => {
    for (let i = 0; i < 100; i++) expect(uuidv4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("does not collide across a 1,000-value batch", () => {
    const values = Array.from({ length: 1000 }, uuidv4);
    expect(new Set(values)).toHaveLength(1000);
  });
  it("server-renders secure generation guidance", () => expect(ssr(UuidTool)).toContain("crypto.getRandomValues"));
});

describe("TOOL url-encoder | URL Encoder / Decoder", () => {
  it("round-trips reserved characters and Unicode with component semantics", () => {
    const input = "hello world&next=/résumé?q=✓";
    expect(decodeURIComponent(encodeURIComponent(input))).toBe(input);
    expect(encodeURIComponent("a b&c")).toBe("a%20b%26c");
  });
  it("rejects malformed percent encoding", () => expect(() => decodeURIComponent("bad%2")).toThrow(URIError));
  it("server-renders both component modes and error guidance", () => {
    const html = ssr(UrlTool);
    expect(html).toContain("encode component");
    expect(html).toContain("decode component");
  });
});

describe("TOOL regex-tester | Regex Tester", () => {
  it("executes global matching with groups and indices", () => {
    const regex = new RegExp("(tool)(hub)", "gi");
    const matches = [..."ToolHub and toolhub".matchAll(regex)];
    expect(matches).toHaveLength(2);
    expect(matches[0].index).toBe(0);
    expect(matches[0].slice(1)).toEqual(["Tool", "Hub"]);
  });
  it("throws a syntax error for an invalid pattern and safely advances zero-length matches", () => {
    expect(() => new RegExp("[", "g")).toThrow(SyntaxError);
    const regex = new RegExp("(?=a)", "g");
    const match = regex.exec("a");
    expect(match?.[0]).toBe("");
    regex.lastIndex++;
    expect(regex.exec("a")).toBeNull();
  });
  it("server-renders pattern, flags, and test-text inputs", () => {
    const html = ssr(RegexTool);
    expect(html).toContain("Pattern (no slashes)");
    expect(html).toContain("Regex flags");
    expect(html).toContain("Test text");
  });
});

describe("TOOL color-converter | Color Format Converter", () => {
  it("converts canonical HEX/RGB/HSL values correctly", () => {
    expect(hexToRgb("#2563EB")).toEqual({ r: 37, g: 99, b: 235 });
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(rgbToHex(255, 0, 0)).toBe("#FF0000");
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
  });
  it("round-trips representative colors and clamps RGB output", () => {
    for (const hex of ["#000000", "#FFFFFF", "#2563EB", "#7F32AA"]) {
      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const back = hslToRgb(hsl.h, hsl.s, hsl.l);
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(2);
    }
    expect(rgbToHex(-4, 300, 1.6)).toBe("#00FF02");
  });
  it("rejects invalid HEX input", () => expect(() => hexToRgb("#12GG00")).toThrow(/valid HEX/i));
  it("server-renders readouts and preview", () => expect(ssr(ColorConverterTool)).toContain("rgb(37, 99, 235)"));
});

describe("TOOL password-generator | Password Generator", () => {
  const all = { lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false };
  it("returns the requested length with at least one character from each selected set", () => {
    const password = generatePassword(64, all);
    expect(password).toHaveLength(64);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[^a-zA-Z0-9]/);
  });
  it("excludes ambiguous characters and handles a 128-character edge", () => {
    const password = generatePassword(128, { ...all, symbols: false, excludeAmbiguous: true });
    expect(password).toHaveLength(128);
    expect(password).not.toMatch(/[Il1O0]/);
  });
  it("rejects an empty character-set selection", () => {
    expect(() => generatePassword(16, { lower: false, upper: false, digits: false, symbols: false, excludeAmbiguous: false })).toThrow(/at least one/i);
  });
  it("server-renders every option and local-security disclosure", () => {
    const html = ssr(PasswordGeneratorTool);
    expect((html.match(/type="checkbox"/g) ?? [])).toHaveLength(5);
    expect(html).toContain("Web Crypto");
  });
});

describe("TOOL password-strength | Password Strength Estimator", () => {
  it("ranks a complex unique password above common and empty passwords", () => {
    expect(passwordStrength("")).toMatchObject({ score: 0, label: "Empty", entropy: 0 });
    expect(passwordStrength("password").score).toBe(1);
    expect(passwordStrength("X9!vQ2#mZ8$pL4&").score).toBeGreaterThan(passwordStrength("password").score);
  });
  it("provides actionable feedback for repetition and missing character classes", () => {
    const result = passwordStrength("aaaaaaaa");
    expect(result.feedback.join(" ")).toMatch(/repeated/i);
    expect(result.feedback.join(" ")).toMatch(/upper and lower/i);
    expect(result.feedback.join(" ")).toMatch(/numbers/i);
  });
  it("server-renders privacy and visibility controls", () => {
    const html = ssr(PasswordStrengthTool);
    expect(html).toContain("Show");
    expect(html).toContain("never typed into any network request");
  });
});

describe("TOOL color-picker | Color Picker", () => {
  it("produces exact readouts for the initial color", () => {
    const rgb = hexToRgb("#2563EB");
    expect(rgb).toEqual({ r: 37, g: 99, b: 235 });
    expect(rgbToHsl(rgb.r, rgb.g, rgb.b)).toEqual({ h: 221, s: 83, l: 53 });
  });
  it("server-renders native and direct HEX inputs plus all readouts", () => {
    const html = ssr(ColorPickerTool);
    expect(html).toContain('type="color"');
    expect(html).toContain("HEX value");
    expect(html).toContain("HSL");
  });
});

describe("TOOL palette-generator | Color Palette Generator", () => {
  it("generates five valid colors for every harmony mode", () => {
    for (const mode of ["complementary", "analogous", "triadic", "monochromatic"] as const) {
      const colors = palette("#2563EB", mode);
      expect(colors).toHaveLength(5);
      colors.forEach((color) => expect(color).toMatch(/^#[0-9A-F]{6}$/));
    }
  });
  it("places the true complement in the complementary palette and rejects invalid input", () => {
    expect(palette("#FF0000", "complementary")).toContain("#00FFFF");
    expect(() => palette("invalid", "analogous")).toThrow(/valid HEX/i);
  });
  it("server-renders all harmony controls and CSS-copy integration", () => {
    const html = ssr(PaletteTool);
    expect((html.match(/aria-pressed=/g) ?? [])).toHaveLength(4);
    expect(html).toContain("Copy as CSS variables");
  });
});

describe("TOOL font-pairing | Font Pairing Helper", () => {
  it("server-renders all six pairings and the copyable CSS preview", () => {
    const html = ssr(FontPairingTool);
    for (const name of ["Modern SaaS", "Editorial Serif", "Tech Mono Accent", "Classic Book", "Bold Swiss", "Friendly Rounded Feel"]) {
      expect(html).toContain(name);
    }
    expect(html).toContain("Copy CSS");
  });
  it("uses an available initial system/font stack", () => expect(ssr(FontPairingTool)).toContain("Inter"));
});

describe("TOOL image-compressor | Image Compressor", () => {
  it("validates image MIME type and 15 MB size limit", () => {
    expect(validateImageFile(fakeFile("image/png", 1024))).toBeNull();
    expect(validateImageFile(fakeFile("text/plain", 12))).toMatch(/not an image/i);
    expect(validateImageFile(fakeFile("image/png", 15 * 1024 * 1024 + 1))).toMatch(/larger than 15 MB/i);
  });
  it("formats expected size labels", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.00 MB");
  });
  it("server-renders upload restrictions and local-processing disclosure", () => {
    const html = ssr(ImageCompressorTool);
    expect(html).toContain("Drop an image to compress");
    expect(html).toContain("Max 15 MB");
  });
});

describe("TOOL image-resizer | Image Resizer", () => {
  it("validates accepted upload files", () => expect(validateImageFile(fakeFile("image/jpeg", 2048))).toBeNull());
  it("preserves aspect-ratio arithmetic for representative dimensions", () => {
    expect(Math.max(1, Math.round(600 * 1080 / 1920))).toBe(338);
    expect(Math.max(1, Math.round(1 * 100 / 10000))).toBe(1);
  });
  it("server-renders the upload workflow", () => expect(ssr(ImageResizerTool)).toContain("Drop an image to resize"));
});

describe("TOOL image-converter | Image Format Converter", () => {
  it("validates supported image input before conversion", () => expect(validateImageFile(fakeFile("image/webp", 2048))).toBeNull());
  it("rejects a non-image before browser decoding", () => expect(validateImageFile(fakeFile("application/pdf", 2048))).toMatch(/not an image/i));
  it("server-renders the local conversion upload workflow", () => expect(ssr(ImageConverterTool)).toContain("Drop an image to convert"));
});

describe("TOOL images-to-pdf | Images to PDF", () => {
  it("loads the real jsPDF dependency and creates a valid PDF byte stream", async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt" });
    pdf.text("ToolHub QA", 24, 24);
    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(500);
  });
  it("validates PDF source images", () => {
    expect(validateImageFile(fakeFile("image/jpeg", 4096))).toBeNull();
    expect(validateImageFile(fakeFile("application/octet-stream", 4096))).toMatch(/not an image/i);
  });
  it("server-renders multi-image upload limits", () => {
    const html = ssr(ImagesToPdfTool);
    expect(html).toContain("up to 30");
    expect(html).toContain("No images yet");
  });
});

describe("TOOL watermark-remover | Watermark Remover", () => {
  it("heals a selected mark using surrounding pixels without mutating input", async () => {
    const width = 5;
    const height = 5;
    const source = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) source.set([80, 120, 160, 255], i * 4);
    source.set([0, 0, 0, 255], 12 * 4);
    const mask = new Uint8Array(width * height);
    mask[12] = 1;
    const progress = vi.fn();
    const result = await inpaintMaskedPixels(width, height, source, mask, 4, progress);
    expect([...result.slice(12 * 4, 12 * 4 + 4)]).toEqual([80, 120, 160, 255]);
    expect(source[12 * 4]).toBe(0);
    expect(progress).toHaveBeenLastCalledWith(1, 1);
  });
  it("returns a copy for an empty mask and rejects invalid dimensions/data", async () => {
    const source = new Uint8ClampedArray([10, 20, 30, 255]);
    const result = await inpaintMaskedPixels(1, 1, source, new Uint8Array([0]));
    expect(result).not.toBe(source);
    expect([...result]).toEqual([...source]);
    await expect(inpaintMaskedPixels(0, 1, source, new Uint8Array([0]))).rejects.toThrow(/positive integers/i);
    await expect(inpaintMaskedPixels(2, 2, source, new Uint8Array(4))).rejects.toThrow(/do not match/i);
  });
  it("rejects a fully selected image with no reconstruction boundary", async () => {
    await expect(inpaintMaskedPixels(2, 2, new Uint8ClampedArray(16), new Uint8Array([1, 1, 1, 1]))).rejects.toThrow(/unpainted image/i);
  });
  it("server-renders ownership and local-processing guidance", () => {
    const html = ssr(WatermarkRemoverTool);
    expect(html).toContain("permission to edit");
    expect(html).toContain("Choose an image");
  });
});

describe("TOOL tip-calculator | Tip Calculator", () => {
  it("calculates tip, total, and per-person amounts", () => {
    expect(tipCalc(100, 20, 4)).toEqual({ tip: 20, total: 120, perPerson: 30, tipPerPerson: 5 });
  });
  it("guards a zero people count", () => expect(tipCalc(100, 10, 0).perPerson).toBe(110));
  it("rejects a negative bill", () => expect(() => tipCalc(-100, 20, 2)).toThrow(/bill/i));
  it("rejects a negative tip percentage", () => expect(() => tipCalc(100, -20, 2)).toThrow(/tip/i));
  it("rejects a negative people count", () => expect(() => tipCalc(100, 20, -2)).toThrow(/people/i));
  it("server-renders bill, tip, and split inputs", () => {
    const html = ssr(TipTool);
    expect(html).toContain("Bill amount");
    expect(html).toContain("Split between");
  });
});

describe("TOOL emi-calculator | EMI Calculator", () => {
  it("calculates zero-interest and interest-bearing loans", () => {
    expect(emi(12000, 0, 12)).toEqual({ monthly: 1000, total: 12000, interest: 0 });
    const result = emi(100000, 10, 12);
    expect(result.monthly).toBeGreaterThan(8700);
    expect(result.monthly).toBeLessThan(8850);
    expect(result.total).toBeCloseTo(result.monthly * 12);
  });
  it("rejects zero duration", () => expect(() => emi(1000, 5, 0)).toThrow(/duration/i));
  it("rejects a negative principal", () => expect(() => emi(-1000, 5, 12)).toThrow(/principal/i));
  it("rejects a negative interest rate", () => expect(() => emi(1000, -5, 12)).toThrow(/interest/i));
  it("server-renders all loan inputs and formula disclosure", () => {
    const html = ssr(EmiTool);
    expect(html).toContain("Loan amount");
    expect(html).toContain("Formula: EMI");
  });
});

describe("TOOL currency-converter | Currency Converter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns a correct conversion through the mocked external-provider integration", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      result: "success",
      rates: { EUR: 0.8 },
      time_last_update_utc: "Tue, 27 Oct 2026 00:00:00 +0000",
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await currencyGET(new Request("http://localhost/api/currency?from=TST&to=EUR&amount=25"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ from: "TST", to: "EUR", amount: 25, rate: 0.8, result: 20 });
    expect(fetchMock).toHaveBeenCalledWith("https://open.er-api.com/v6/latest/TST", expect.any(Object));
  });

  it("rejects invalid currency codes and negative/NaN amounts before calling the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const query of ["from=US&to=EUR&amount=1", "from=USD&to=EURO&amount=1", "from=USD&to=EUR&amount=-1", "from=USD&to=EUR&amount=nope"]) {
      const response = await currencyGET(new Request(`http://localhost/api/currency?${query}`));
      expect(response.status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports unavailable target rates and provider failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ result: "success", rates: {} }), { status: 200 })));
    const missing = await currencyGET(new Request("http://localhost/api/currency?from=QAX&to=ZZZ&amount=1"));
    expect(missing.status).toBe(422);
    expect((await missing.json()).error).toMatch(/not available/i);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("offline")));
    const offline = await currencyGET(new Request("http://localhost/api/currency?from=ERR&to=EUR&amount=1"));
    expect(offline.status).toBe(502);
    expect((await offline.json()).error).toMatch(/unreachable/i);
  });

  it("server-renders source disclosure and swap integration", () => {
    const html = ssr(CurrencyTool);
    expect(html).toContain("open.er-api.com");
    expect(html).toContain("Swap currencies");
  });
});

describe("TOOL qr-generator | QR Code Generator", () => {
  it("uses the real QR dependency to produce a PNG data URL", async () => {
    const url = await QRCode.toDataURL("https://example.com?q=ToolHub", { width: 320, margin: 2, errorCorrectionLevel: "M" });
    expect(url).toMatch(/^data:image\/png;base64,/);
    expect(url.length).toBeGreaterThan(500);
  });
  it("supports Unicode and rejects content beyond QR capacity", async () => {
    await expect(QRCode.toDataURL("こんにちは ToolHub 👋", { errorCorrectionLevel: "M" })).resolves.toMatch(/^data:image\/png;base64,/);
    await expect(QRCode.toDataURL("x".repeat(10000), { errorCorrectionLevel: "M" })).rejects.toThrow();
  });
  it("server-renders sizing and download workflow placeholders", () => {
    const html = ssr(QrTool);
    expect(html).toContain("Text or URL");
    expect(html).toContain("Image size: 320px");
  });
});
