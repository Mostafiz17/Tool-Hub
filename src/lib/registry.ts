export type Category = { slug: string; name: string; description: string; icon: string };
export type ToolDef = {
  id: string; name: string; slug: string; description: string; category: string;
  keywords: string[]; icon: string; featured?: boolean; popular?: boolean; status: "published" | "draft" | "deprecated";
};

export const CATEGORIES: Category[] = [
  { slug: "calculators", name: "Calculators & Dates", description: "Everyday math, percentages, units, ages, dates and countdowns.", icon: "Calculator" },
  { slug: "text", name: "Text Tools", description: "Count, convert, clean, generate and compare text with live results.", icon: "Type" },
  { slug: "developer", name: "Developer Tools", description: "JSON, Base64, UUIDs, URLs, regex, colors and secure passwords.", icon: "Code2" },
  { slug: "design", name: "Color & Design", description: "Pick colors, build palettes and pair fonts that actually work together.", icon: "Palette" },
  { slug: "image", name: "Image Tools", description: "Compress, resize, convert, heal small marks, and combine images — processed locally in your browser.", icon: "Image" },
  { slug: "finance", name: "Finance & Utility", description: "Tips, EMIs, live currency conversion and QR codes.", icon: "Wallet" },
];

const t = (id: string, name: string, slug: string, description: string, category: string, icon: string, keywords: string[], opts: Partial<ToolDef> = {}): ToolDef =>
  ({ id, name, slug, description, category, icon, keywords, status: "published", ...opts });

export const TOOLS: ToolDef[] = [
  t("calculator", "Basic Calculator", "calculator", "Add, subtract, multiply and divide with full keyboard support and safe arithmetic (no eval).", "calculators", "Calculator", ["math", "add", "arithmetic", "sum"], { popular: true }),
  t("percentage-calculator", "Percentage Calculator", "percentage-calculator", "Find a percentage of a number, percentage change and percentage difference.", "calculators", "Percent", ["percent", "%", "increase", "decrease"], { popular: true }),
  t("unit-converter", "Unit Converter", "unit-converter", "Convert length, mass, temperature, time, data storage and volume accurately.", "calculators", "Ruler", ["convert", "meters", "kg", "fahrenheit", "celsius"], { popular: true, featured: true }),
  t("age-calculator", "Age Calculator", "age-calculator", "Exact age in years, months and days from a date of birth — leap years handled.", "calculators", "Cake", ["birthday", "dob", "years old"]),
  t("date-difference", "Date Difference", "date-difference", "Days, weeks, months and business days between two dates.", "calculators", "CalendarDays", ["days between", "duration", "interval"]),
  t("countdown", "Countdown Timer", "countdown", "Live countdown to any date and time, with a clear expired state.", "calculators", "Timer", ["timer", "until", "event"], { featured: true }),
  t("word-counter", "Word & Character Counter", "word-counter", "Words, characters, lines, paragraphs, reading time — updated live as you type.", "text", "FileText", ["count", "words", "characters", "essay"], { popular: true }),
  t("case-converter", "Case Converter", "case-converter", "UPPERCASE, lowercase, Title Case, sentence case, camelCase, snake_case and kebab-case.", "text", "CaseSensitive", ["uppercase", "lowercase", "title", "camel"], { popular: true }),
  t("lorem-ipsum", "Lorem Ipsum Generator", "lorem-ipsum", "Generate real placeholder text by words, sentences or paragraphs.", "text", "AlignLeft", ["placeholder", "dummy", "filler"]),
  t("whitespace-cleaner", "Whitespace Cleaner", "whitespace-cleaner", "Trim, collapse repeated spaces and normalize line breaks with explicit options.", "text", "Eraser", ["trim", "spaces", "clean", "remove"]),
  t("text-diff", "Text Diff", "text-diff", "Compare two texts line by line with additions and removals highlighted.", "text", "GitCompare", ["compare", "difference", "diff"], { featured: true }),
  t("json-formatter", "JSON Formatter & Validator", "json-formatter", "Validate, pretty-print and minify JSON with precise syntax error locations.", "developer", "Braces", ["json", "format", "validate", "pretty"], { popular: true, featured: true }),
  t("base64", "Base64 Encoder / Decoder", "base64", "Encode and decode Base64 with full Unicode support and malformed-input detection.", "developer", "Binary", ["encode", "decode", "b64"], { popular: true }),
  t("uuid-generator", "UUID Generator", "uuid-generator", "Cryptographically secure UUID v4 values — generate one or a batch and copy.", "developer", "Fingerprint", ["guid", "uuid", "v4", "random id"], { popular: true }),
  t("url-encoder", "URL Encoder / Decoder", "url-encoder", "Encode and decode URL components safely with validation.", "developer", "Link", ["uri", "percent encoding", "decode"]),
  t("regex-tester", "Regex Tester", "regex-tester", "Test patterns with flags, live match highlighting and match details.", "developer", "Regex", ["regular expression", "match", "pattern"], { featured: true }),
  t("color-converter", "Color Format Converter", "color-converter", "Convert between HEX, RGB and HSL with validation and live preview.", "developer", "SwatchBook", ["hex", "rgb", "hsl", "convert color"]),
  t("password-generator", "Password Generator", "password-generator", "Strong passwords via Web Crypto — length, character sets, ambiguous-character exclusion.", "developer", "KeyRound", ["password", "secure", "random"], { popular: true, featured: true }),
  t("password-strength", "Password Strength Estimator", "password-strength", "Entropy-based strength estimate with honest explanations. Never sent anywhere.", "developer", "ShieldCheck", ["strength", "entropy", "zxcvbn"]),
  t("color-picker", "Color Picker", "color-picker", "Pick any color and get HEX, RGB and HSL values with one-click copy.", "design", "Pipette", ["pick", "eyedropper", "hex"]),
  t("palette-generator", "Color Palette Generator", "palette-generator", "Complementary, analogous, triadic and monochromatic palettes from any base color.", "design", "Palette", ["palette", "scheme", "harmony"], { featured: true }),
  t("font-pairing", "Font Pairing Helper", "font-pairing", "Proven heading/body font pairings with live previews and copyable CSS.", "design", "Type", ["fonts", "typography", "pairing"]),
  t("image-compressor", "Image Compressor", "image-compressor", "Compress JPG/PNG/WebP locally, compare sizes and download — nothing is uploaded.", "image", "FileImage", ["compress", "shrink", "optimize", "jpg"], { popular: true, featured: true }),
  t("image-resizer", "Image Resizer", "image-resizer", "Resize images by pixels or percentage, with optional aspect-ratio lock.", "image", "Scaling", ["resize", "dimensions", "pixels"]),
  t("image-converter", "Image Format Converter", "image-converter", "Convert between PNG, JPEG and WebP with transparency handled correctly.", "image", "Repeat", ["convert", "png", "webp", "jpeg"]),
  t("images-to-pdf", "Images to PDF", "images-to-pdf", "Combine multiple images into one real PDF — reorder, preview and download.", "image", "FileDown", ["pdf", "combine", "jpg to pdf"], { featured: true }),
  t("watermark-remover", "Watermark Remover", "watermark-remover", "Paint over a small mark and locally heal it from nearby pixels. Best on simple backgrounds; results vary.", "image", "Eraser", ["remove watermark", "heal image", "object remover", "retouch", "repair photo"], { featured: true }),
  t("tip-calculator", "Tip Calculator", "tip-calculator", "Tip amount, total bill and per-person split in one glance.", "finance", "Receipt", ["tip", "bill", "split", "restaurant"], { popular: true }),
  t("emi-calculator", "EMI Calculator", "emi-calculator", "Monthly installment, total interest and repayment from principal, rate and tenure.", "finance", "Landmark", ["loan", "emi", "interest", "mortgage"], { popular: true }),
  t("currency-converter", "Currency Converter", "currency-converter", "Live exchange rates from a real public source, with source and update time shown.", "finance", "ArrowLeftRight", ["currency", "exchange", "usd", "eur", "fx"], { featured: true }),
  t("qr-generator", "QR Code Generator", "qr-generator", "Generate real QR codes from text or URLs and download as PNG.", "finance", "QrCode", ["qr", "code", "scan"], { popular: true }),
];

export const publishedTools = TOOLS.filter((x) => x.status === "published");
export const getTool = (slug: string) => publishedTools.find((x) => x.slug === slug);
export const getCategory = (slug: string) => CATEGORIES.find((x) => x.slug === slug);
export const toolsByCategory = (slug: string) => publishedTools.filter((x) => x.category === slug);
export function searchTools(q: string): ToolDef[] {
  const s = q.trim().toLowerCase();
  if (!s) return publishedTools;
  return publishedTools.filter((x) =>
    [x.name, x.description, x.category, ...x.keywords].join(" ").toLowerCase().includes(s) ||
    s.split(/\s+/).every((w) => [x.name, x.description, ...x.keywords].join(" ").toLowerCase().includes(w))
  );
}
