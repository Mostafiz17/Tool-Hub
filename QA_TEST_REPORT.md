# ToolHub Automated QA Test Report

**Run date:** 2026-10-27 (Asia/Dhaka)  
**Scope:** All 31 published tools in `src/lib/registry.ts`  
**Primary suite:** `src/qa/tools.qa.test.tsx`  
**Live suite:** `src/qa/currency.live.test.ts`  
**Browser suite:** `tests/e2e/local-tools.spec.ts`  
**Runners:** Vitest 5.0.5 on Node.js 24.20.0; Playwright 1.64.1 with real Chromium

## Executive summary

| Metric | Result |
|---|---:|
| Total tools discovered | 31 |
| Total tools with meaningful automated tests executed | 31 |
| PASS tools | 31 |
| FAIL tools | 0 |
| BLOCKED tools | 0 |
| NOT TESTED tools | 0 |
| Total tests executed (Vitest + Playwright) | 145 |
| Tests passed | 145 |
| Tests failed | 0 |
| Test files passed / failed | 4 / 0 |

All 31 tools now have meaningful automated coverage. The final repository-wide Vitest command, `npm exec vitest -- run`, passed 137/137 tests, including the real currency-provider integration. The separate Playwright suite passed 8/8 tests in a real Chromium browser. The six formerly blocked browser-dependent tools are now PASS because their critical workflows were genuinely executed, not mocked or skipped.

### Status definitions used

- **PASS:** Every defined assertion for the tool succeeded.
- **FAIL:** At least one executed assertion produced an unexpected result.
- **BLOCKED:** Testing cannot be completed because required credentials, configuration, infrastructure, or dependencies are unavailable. There are no tools in this category.
- **NOT TESTED:** No meaningful test executed. There are no tools in this category.

## Test method and evidence

- **Real unit tests:** Production functions were imported and executed directly. These are not mocks.
- **Real SSR smoke tests:** Actual React tool components were rendered with `react-dom/server` to verify initial render and integration wiring.
- **Real dependency integrations:** `qrcode` generated PNG data URLs; `jspdf` generated and validated a PDF byte stream.
- **Mocked integration:** Currency-provider success, invalid response, unavailable rate, and outage behavior were tested by mocking only the upstream HTTP response. The production route handler executed unchanged.
- **Real live integration:** The production currency route called `open.er-api.com` and returned a valid USD/EUR conversion.
- **Real browser integrations:** Playwright drove Chromium through timer state transitions, file uploads, previews, canvas drawing/encoding, object URLs, pointer and keyboard input, PDF generation, and downloads. Downloaded image bytes were decoded in Chromium and checked for dimensions, pixel behavior, signatures, and filenames; downloaded PDFs were checked for header, EOF marker, and page objects.

## Per-tool results

### Calculators & dates

#### 1. Basic Calculator — ID `calculator` — **PASS**

- PASS — precedence, parentheses, decimals, and modulo.
- PASS — unary signs after operators, before parentheses, and repeated signs: `2*-3`, `2/-4`, `-(2+3)`, `--3`, and `2--3`.
- PASS — empty input, unsafe characters, division by zero, and mismatched parentheses are rejected.
- PASS — calculator workspace server render.
- Missing coverage: keyboard event behavior and button-click sequences in a real browser.

#### 2. Percentage Calculator — ID `percentage-calculator` — **PASS**

- PASS — percentage-of, increase/decrease, and symmetric percentage difference.
- PASS — zero-pair difference and zero-baseline validation.
- PASS — all calculation modes server render.
- Missing coverage: real DOM mode switching, copy-to-clipboard behavior, very large numeric input.

#### 3. Unit Converter — ID `unit-converter` — **PASS**

- PASS — length, mass, time, binary data, and volume conversions.
- PASS — Celsius/Fahrenheit/Kelvin formulas and identity conversion.
- PASS — unknown-unit error handling.
- PASS — category and swap controls server render.
- Missing coverage: real DOM unit swapping and select interaction; numeric overflow.

#### 4. Age Calculator — ID `age-calculator` — **PASS**

- PASS — leap-day age and aggregate totals.
- PASS — future dates are rejected.
- PASS — invalid date-of-birth and current-date objects are rejected before calendar arithmetic.
- PASS — date-input workspace server render.
- Missing coverage: browser locale/time-zone variations and actual date-picker interaction.

#### 5. Date Difference — ID `date-difference` — **PASS**

- PASS — reversed dates, total days, weeks, and business-day calculation.
- PASS — identical-date edge case.
- PASS — invalid start/end date objects are rejected and the UI has an error-rendering path.
- PASS — both date inputs server render.
- Missing coverage: holiday calendars are intentionally not supported; browser date-picker and extreme date ranges remain untested.

#### 6. Countdown Timer — ID `countdown` — **PASS**

- PASS — timer input and empty-state guidance server render.
- PASS — correct `datetime-local` browser control is present.
- PASS — Playwright set a deterministic future target, observed the active countdown, advanced the real browser clock past the target, and verified the expired state.
- PASS — changing the input to an already-expired target shows the correct validation guidance.
- Missing coverage: multi-day rollover, unmount cleanup instrumentation, and daylight-saving/ambiguous local times.

### Text tools

#### 7. Word & Character Counter — ID `word-counter` — **PASS**

- PASS — words, characters, non-space characters, lines, paragraphs, sentences, reading time, and speaking time.
- PASS — empty and whitespace-only input.
- PASS — all result metrics server render.
- Missing coverage: very large input performance and language-specific word segmentation.

#### 8. Case Converter — ID `case-converter` — **PASS**

- PASS — upper, lower, camel, Pascal, snake, kebab, and constant cases.
- PASS — title case, sentence case, punctuation, and empty input.
- PASS — all nine modes server render.
- Missing coverage: non-Latin alphabets, locale-sensitive casing, real clipboard interaction.

#### 9. Lorem Ipsum Generator — ID `lorem-ipsum` — **PASS**

- PASS — deterministic word and sentence counts.
- PASS — paragraph separation and one-word edge case.
- PASS — count limits and regenerate action server render.
- Missing coverage: randomness distribution, interactive 500-item clamp, repeated regenerate clicks.

#### 10. Whitespace Cleaner — ID `whitespace-cleaner` — **PASS**

- PASS — outer trimming, repeated-space collapse, and repeated-line collapse.
- PASS — per-line trimming and blank-line removal.
- PASS — no-op behavior when every option is disabled.
- PASS — all five options server render.
- Missing coverage: mixed CRLF/CR line endings, non-breaking spaces, clipboard integration.

#### 11. Text Diff — ID `text-diff` — **PASS**

- PASS — same/add/remove line ordering.
- PASS — identical input and the large-input fallback path (501 × 501 lines).
- PASS — both editors server render.
- Missing coverage: repeated-line alignment quality, very large browser rendering, Unicode normalization.

### Developer tools

#### 12. JSON Formatter & Validator — ID `json-formatter` — **PASS**

- PASS — pretty printing and minification of nested JSON.
- PASS — concrete errors for malformed and empty input.
- PASS — format/minify controls server render.
- Missing coverage: extremely deep JSON and browser copy behavior.

#### 13. Base64 Encoder / Decoder — ID `base64` — **PASS**

- PASS — ASCII, Unicode, emoji, multiline, and empty round trips.
- PASS — malformed alphabet, invalid length, and invalid UTF-8 rejection.
- PASS — encode/decode modes server render.
- Missing coverage: multi-megabyte payload performance and memory limits.

#### 14. UUID Generator — ID `uuid-generator` — **PASS**

- PASS — 100 UUIDs satisfy version-4 and RFC-variant shape requirements.
- PASS — no collision in a 1,000-value batch.
- PASS — secure-generation guidance server render.
- Missing coverage: statistical randomness analysis and interactive 1/100 batch clamping.

#### 15. URL Encoder / Decoder — ID `url-encoder` — **PASS**

- PASS — reserved-character and Unicode round trip with component semantics.
- PASS — malformed percent-encoding rejection.
- PASS — both modes server render.
- Missing coverage: interactive mode switching and very large URL components.

#### 16. Regex Tester — ID `regex-tester` — **PASS**

- PASS — real `RegExp` global matching, groups, and match indices.
- PASS — invalid-pattern syntax error and zero-length-match advancement behavior.
- PASS — pattern, flags, and test-text inputs server render.
- Missing coverage: component-level 500-match cap, flag sanitization interaction, catastrophic-backtracking protection/performance.

#### 17. Color Format Converter — ID `color-converter` — **PASS**

- PASS — canonical HEX/RGB/HSL conversions and shorthand HEX.
- PASS — representative round trips and RGB clamping.
- PASS — invalid HEX rejection.
- PASS — readouts and preview server render.
- Missing coverage: invalid HSL/RGB direct-input paths do not exist in the UI; native color-picker interaction remains untested.

#### 18. Password Generator — ID `password-generator` — **PASS**

- PASS — requested length and guaranteed inclusion from every selected character set.
- PASS — ambiguous-character exclusion and 128-character edge.
- PASS — empty character-set selection rejection.
- PASS — all options and Web Crypto disclosure server render.
- Missing coverage: statistical distribution/modulo bias analysis, clipboard interaction, live checkbox/range interaction.

#### 19. Password Strength Estimator — ID `password-strength` — **PASS**

- PASS — empty/common/complex ranking.
- PASS — repeated-character and missing-character-class feedback.
- PASS — privacy and visibility controls server render.
- Missing coverage: breach-database checking is explicitly outside this local heuristic; interactive show/hide behavior remains untested.

### Color & design

#### 20. Color Picker — ID `color-picker` — **PASS**

- PASS — exact initial HEX/RGB/HSL values.
- PASS — native picker, direct HEX input, and readouts server render.
- Missing coverage: actual native color dialog, incremental invalid HEX editing, clipboard behavior.

#### 21. Color Palette Generator — ID `palette-generator` — **PASS**

- PASS — five valid colors for complementary, analogous, triadic, and monochromatic modes.
- PASS — true red complement and invalid-base-color handling.
- PASS — all harmony controls and CSS-copy integration server render.
- Missing coverage: interactive harmony switching and clipboard writes.

#### 22. Font Pairing Helper — ID `font-pairing` — **PASS**

- PASS — all six pairing choices and copyable CSS server render.
- PASS — initial font stack is present.
- Missing coverage: live switching, computed browser font fallback, clipboard writes.

### Image tools

#### 23. Image Compressor — ID `image-compressor` — **PASS**

- PASS — image MIME validation, non-image rejection, and 15 MB limit.
- PASS — byte-size formatting.
- PASS — upload restrictions and local-processing disclosure server render.
- PASS — Chromium uploaded and decoded a deterministic 64 × 48 PNG, displayed both previews, encoded WebP through the production canvas path, and downloaded it.
- PASS — downloaded output has the expected `compressed.webp` filename, RIFF/WEBP signature, MIME decoding behavior, and 64 × 48 dimensions.
- PASS — oversize-file validation is visibly rendered before processing; regression coverage protects the previously hidden validation error.
- Missing coverage: cross-browser quality/size comparisons, PNG/JPEG branches, unsupported-encoder behavior, and object-URL revocation timing.

#### 24. Image Resizer — ID `image-resizer` — **PASS**

- PASS — accepted image-file validation.
- PASS — representative aspect-ratio arithmetic and minimum dimension.
- PASS — upload workflow server render.
- PASS — Chromium verified oversize-file validation, source preview/dimensions, locked 64 × 48 to 32 × 24 resizing, output preview, and real PNG download.
- PASS — downloaded PNG has a PNG signature, 32 × 24 decoded dimensions, and a `.png` filename matching its actual bytes.
- PASS — unlocked dimensions can be edited independently and a zero dimension disables processing.
- PASS — regression coverage protects the discovered mismatched-extension defect and hidden validation error.
- Missing coverage: 25/50/75% shortcut buttons, 12,000-pixel boundary, JPEG input/output, and object-URL revocation timing.

#### 25. Image Format Converter — ID `image-converter` — **PASS**

- PASS — valid WebP input accepted.
- PASS — non-image input rejected before decode.
- PASS — conversion upload workflow server render.
- PASS — Chromium converted one deterministic transparent PNG through the production canvas path to PNG, JPEG, and WebP.
- PASS — every downloaded output has the correct extension, file signature, and decoded 64 × 48 dimensions.
- PASS — PNG transparency is preserved and JPEG transparent pixels are flattened to white.
- PASS — oversize-file validation is visible; regression coverage protects the previously hidden validation error.
- Missing coverage: unsupported-codec error behavior, animated inputs, and object-URL revocation timing.

#### 26. Images to PDF — ID `images-to-pdf` — **PASS**

- PASS — real `jspdf` dependency generated a valid `%PDF-` byte stream.
- PASS — image-source validation.
- PASS — multi-image limit and empty state server render.
- PASS — Chromium uploaded two deterministic images, rendered previews, reordered them, and generated a real two-page download through the production FileReader/image/canvas path.
- PASS — the download filename is `toolhub-images.pdf`; bytes contain a `%PDF-` header, `%%EOF`, and exactly two page objects.
- PASS — removing an uploaded image updates the list and one-page generation state; oversize input is visibly rejected.
- Missing coverage: 30-file clamp, visual verification of scaling/centering and page order inside the PDF, and forced save failure.

#### 27. Watermark Remover — ID `watermark-remover` — **PASS**

- PASS — real inpainting reconstructs selected pixels, preserves unselected pixels, does not mutate input, and reports progress.
- PASS — empty mask, invalid dimensions, and mismatched data validation.
- PASS — full-mask/no-boundary error handling.
- PASS — ownership and local-processing guidance server render.
- PASS — Chromium uploaded/decoded a marked image and exercised pointer paint, pointer erase, keyboard painting, selection-state accounting, and processing through the real canvases.
- PASS — the exported `marked-edited.png` has a PNG signature, decodes to 64 × 48, and the selected center pixel is no longer the original black mark.
- PASS — Restore original clears the processed/download state; oversize input is visibly rejected.
- Missing coverage: 8-megapixel scaling, 1.5-million-pixel selection guard, long-running progress rendering, JPEG/WebP exports, and complex-background visual quality.

### Finance & utility

#### 28. Tip Calculator — ID `tip-calculator` — **PASS**

- PASS — normal tip, total, split, and per-person results.
- PASS — zero people count is guarded to one person.
- PASS — negative bill is rejected with a bill-specific message.
- PASS — negative tip percentage is rejected with a tip-specific message.
- PASS — negative people count is rejected with a people-specific message; the existing zero-person guard remains supported.
- PASS — non-finite values and fractional people counts are rejected by shared validation; UI errors render through `ErrorBox`.
- PASS — bill/tip/split controls server render.
- Missing coverage: decimal rounding display, very large values, interactive preset buttons.

#### 29. EMI Calculator — ID `emi-calculator` — **PASS**

- PASS — zero-interest and interest-bearing loans.
- PASS — zero-month duration rejection.
- PASS — negative principal is rejected with a principal-specific message.
- PASS — negative annual interest is rejected with an interest-specific message.
- PASS — non-finite values, fractional months, and calculation overflow are rejected; zero interest remains supported.
- PASS — loan inputs and formula disclosure server render.
- Missing coverage: non-finite inputs, fractional-month rounding from the UI, very large tenure/interest overflow.

#### 30. Currency Converter — ID `currency-converter` — **PASS**

- PASS (mocked upstream) — correct route conversion and provider request construction.
- PASS (no upstream call) — invalid codes, negative amounts, and NaN amounts return HTTP 400.
- PASS (mocked upstream) — unavailable target returns 422; provider outage returns 502 with an honest message.
- PASS (SSR) — source disclosure and swap control render.
- PASS (real live integration) — production route retrieved a real USD/EUR rate from `open.er-api.com`, returned a positive rate/result, source, and valid update time.
- Missing coverage: ten-minute cache expiry/hit verification, concurrent request behavior, rate-provider schema drift.

#### 31. QR Code Generator — ID `qr-generator` — **PASS**

- PASS (real dependency) — generated a PNG data URL for a URL payload.
- PASS (real dependency) — generated Unicode content and rejected content beyond QR capacity.
- PASS — size and download workflow placeholders server render.
- Missing coverage: decoding the produced QR with an independent scanner, browser debounce, size-slider interaction, actual PNG download.

## Resolved failures

### F-01: Calculator mishandles unary minus after multiplication

- **Resolution status:** FIXED — targeted and full-suite regression tests pass.

- **Tool:** Basic Calculator (`calculator`)
- **Test:** `src/qa/tools.qa.test.tsx:104`
- **Implementation:** `src/lib/logic.ts:14-37`
- **Error:** `AssertionError: expected -3 to be -6`
- **Reproduce:** Enter `2*-3` in the calculator and evaluate, or call `evaluateExpression("2*-3")`.
- **Expected:** `-6`.
- **Actual:** `-3`.
- **Cause:** Unary minus is normalized by inserting `0`, producing tokens equivalent to `2 * 0 - 3`; operator precedence changes the intended grouping.
- **Implemented fix:** Added distinct right-associative `u-`/`u+` operators with higher precedence. Regression coverage includes `2*-3`, `2/-4`, `-(2+3)`, `--3`, and `2--3`.

### F-02: Age calculator accepts invalid `Date` objects

- **Resolution status:** FIXED — targeted and full-suite regression tests pass.

- **Tool:** Age Calculator (`age-calculator`)
- **Test:** `src/qa/tools.qa.test.tsx:167`
- **Implementation:** `src/lib/logic.ts:75-83`
- **Error:** `AssertionError: expected [Function] to throw an error`
- **Reproduce:** Call `ageFromDob(new Date("invalid"), new Date("2026-01-01"))`.
- **Expected:** A validation error such as `Invalid date of birth`.
- **Actual:** No exception; the returned age fields contain `NaN`.
- **Implemented fix:** Both the birth date and current date are validated with `getTime()` before comparison or arithmetic; the existing Age UI error path surfaces the message.

### F-03: Date difference accepts invalid `Date` objects

- **Resolution status:** FIXED — targeted and full-suite regression tests pass.

- **Tool:** Date Difference (`date-difference`)
- **Test:** `src/qa/tools.qa.test.tsx:179`
- **Implementation:** `src/lib/logic.ts:85-94`; UI error path at `src/components/tools-calc.tsx:96`
- **Error:** `AssertionError: expected [Function] to throw an error`
- **Reproduce:** Call `dateDiff(new Date("invalid"), new Date("2024-01-01"))`.
- **Expected:** A validation error.
- **Actual:** No exception; totals/breakdown contain `NaN` values.
- **Implemented fix:** Both dates are validated before sorting/arithmetic, and `DateDiffTool` now catches and displays the validation message through `ErrorBox`.

### F-04: Tip calculator accepts invalid negative inputs

- **Resolution status:** FIXED — all three negative-input regressions pass in targeted and full-suite runs.

- **Tool:** Tip Calculator (`tip-calculator`)
- **Tests:** `src/qa/tools.qa.test.tsx:576-578`
- **Implementation:** `src/lib/logic.ts:228-239`; UI validation path at `src/components/tools-finance.tsx:7-27`
- **Errors:** Three assertions reported `expected [Function] to throw an error`.
- **Reproduce:** Call `tipCalc(-100, 20, 2)`, `tipCalc(100, -20, 2)`, and `tipCalc(100, 20, -2)`. Equivalent negative values can be typed into number fields despite their `min` attributes.
- **Expected:** Negative bill, percentage, or people inputs are rejected with a clear validation message.
- **Actual:** Negative bill produces `tip=-20`, `total=-120`; negative tip produces `tip=-20`, `total=80`; negative people is silently coerced to one person.
- **Implemented fix:** `tipCalc` now validates finiteness, integer people counts, and negative ranges with field-specific errors. `TipTool` catches and renders errors through `ErrorBox` without changing valid calculations.

### F-05: EMI calculator accepts negative principal and interest

- **Resolution status:** FIXED — both negative-input regressions pass in targeted and full-suite runs.

- **Tool:** EMI Calculator (`emi-calculator`)
- **Tests:** `src/qa/tools.qa.test.tsx:595-596`
- **Implementation:** `src/lib/logic.ts:215-226`; UI inputs at `src/components/tools-finance.tsx:37-39`
- **Errors:** Two assertions reported `expected [Function] to throw an error`.
- **Reproduce:** Call `emi(-1000, 5, 12)` and `emi(1000, -5, 12)`, or type negative values in the number fields.
- **Expected:** Negative principal and annual interest are rejected.
- **Actual:** The formula executes and returns nonsensical negative principal/interest repayment values.
- **Implemented fix:** EMI validation now rejects non-finite values, negative principal/rate, non-integer or non-positive months, and non-finite formula output while preserving zero-interest loans.

## Browser regressions discovered and fixed

### B-01: Image validation messages were hidden

- **Resolution status:** FIXED — Playwright regressions pass for Image Compressor, Image Resizer, and Image Format Converter.
- **Tools:** `image-compressor`, `image-resizer`, `image-converter`
- **Tests:** `tests/e2e/local-tools.spec.ts:109`, `tests/e2e/local-tools.spec.ts:129`, `tests/e2e/local-tools.spec.ts:164`
- **Implementation:** `src/components/tools-image.tsx:51`, `src/components/tools-image.tsx:85`, `src/components/tools-image.tsx:114`
- **Reproduce:** Upload an image larger than 15 MB to any affected tool.
- **Expected:** The 15 MB validation message is visible and processing does not start.
- **Actual before fix:** The file state remained empty and the error component was rendered only inside the loaded-file branch, so no message appeared.
- **Implemented fix:** Error rendering now sits outside the loaded-file conditional. Processing behavior and layout are unchanged.

### B-02: PNG resizer output used a JPEG filename

- **Resolution status:** FIXED — the real-browser download regression passes.
- **Tool:** Image Resizer (`image-resizer`)
- **Test:** `tests/e2e/local-tools.spec.ts:129`
- **Implementation:** `src/components/tools-image.tsx:81`, `src/components/tools-image.tsx:97`
- **Reproduce:** Upload a PNG, resize it, and download the result.
- **Expected:** PNG bytes download with a `.png` filename.
- **Actual before fix:** The canvas produced PNG bytes but the hard-coded filename ended in `.jpg`.
- **Implemented fix:** Encoding and filename now share one derived output type, preserving PNG and JPEG behavior.

## Remaining blockers

None. No tool is marked BLOCKED or NOT TESTED. The missing scenarios listed per tool are coverage opportunities, not blockers for the tested critical workflows.

## Rerun instructions

```bash
npm run test:qa
npm run test:qa:live
npm exec vitest -- run
npm run test:e2e
npm run typecheck
npm run lint
```

`test:qa` runs the 107 primary per-tool/inventory tests. `test:qa:live` performs the real external currency call. The repository-wide Vitest command runs those plus the shared-logic regression suite and excludes Playwright specs by configuration. `test:e2e` starts or reuses the local Next.js server and runs the real Chromium suite.

## Post-fix verification

- Targeted five-tool/shared-logic run: **26 passed, 0 failed** (110 unrelated tests filtered out).
- Full Vitest suite: **137 passed, 0 failed** across 3 test files.
- Playwright Chromium suite: **8 passed, 0 failed** across 1 test file.
- Combined automated tests: **145 passed, 0 failed**.
- TypeScript (`npm run typecheck`): **PASS**.
- ESLint (`npm run lint`): **PASS with 0 errors**; 7 existing `@next/next/no-img-element` warnings remain outside this fix scope.
- Remaining tool failures: **none**.
- Remaining BLOCKED tools: **none**.
- Remaining NOT TESTED tools: **none**.
