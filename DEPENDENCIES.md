# ToolHub — Dependencies

Complete inventory of every declared package, its exact installed version, why it was chosen, and where it is used. Version-matched against `package.json` and `npm ls --depth=0`.

> Dependency philosophy: **minimal and stable**. Every runtime package below maps to a concrete, non-negotiable product requirement (a tool feature the project must ship). Everything else — routing, styling, state, icons, validation-style utilities — is hand-written on top of Next.js and React so the bundle stays small and nothing depends on an abandoned or experimental library.

---

## Runtime dependencies (`dependencies`)

| Package | Version | Purpose | Used in |
|---|---|---|---|
| `next` | `16.2.6` | React framework: App Router pages, server rendering, and the modular REST API route handlers (`src/app/api/*`) that act as the backend. | Whole app |
| `react` | `19.2.6` | UI library. Current stable release paired with Next 16. | Whole app |
| `react-dom` | `19.2.6` | React DOM renderer. Version pinned to match `react` exactly. | Whole app |
| `mongodb` | `7.7.0` | Official MongoDB Node.js driver. Provides the shared client, typed user collection, unique email index, embedded favorites/preferences updates, and database health probe. | `src/db/*`, auth/favorites/preferences routes |
| `dotenv` | `17.3.1` | Loads `.env` values (for example `MONGODB_URI`, `MONGODB_DB`, and `AUTH_SECRET`) into `process.env` at runtime. | Server runtime |
| `lucide-react` | `1.55.0` | The project's icon set (search, heart, tool category icons, UI affordances). Tree-shakeable, MIT-licensed, consistent 24px grid — required by the brief's "Lucide React icons" spec. | `src/components/*` |
| `qrcode` | `1.5.4` | **QR Code Generator** — generates genuine QR codes (byte mode, error correction) rendered to a PNG data URL. Pure JS, no native deps, runs fully client-side. | `tools-finance.tsx` |
| `jspdf` | `4.2.1` | **Tool #26** — builds real multi-page PDF documents from reordered images. Compatible with React 19 / modern bundlers (UMD + ESM entry), MIT-licensed. | `tools-image.tsx` (Images→PDF) |
| `vitest` | `5.0.4` | Test runner for the pure-logic unit test suite (`src/lib/logic.test.ts`). Jest-compatible API, native ESM + TS via Vite transform, no extra config needed. | `src/lib/logic.test.ts` |

### Why `qrcode` and `jspdf` were allowed
Both satisfy a hard product requirement from the tool list (real QR output; real PDF output). Each was checked for compatibility with React 19 / Next 16 before install: no native compilation, no peer-dep conflicts, actively maintained.

### Deliberately **not** used
- **No `eval`/arithmetic libs** — calculator uses a hand-written tokenizer + shunting-yard evaluator (`src/lib/logic.ts`).
- **No password hashing lib (bcrypt/argon2)** — Node's built-in `crypto.scrypt` provides memory-hard hashing with zero native dependencies.
- **No auth/session lib** — sessions are HMAC-signed HttpOnly cookies implemented in `src/lib/auth.ts`.
- **No zod / form lib** — request validation is explicit and hand-written in the route handlers (the brief allowed "where appropriate"; here the request shapes are small and stable).
- **No animation/UI/CSS framework** — hero glass effects, motion and design tokens are plain CSS in `src/app/globals.css`, honoring `prefers-reduced-motion`.
- **No `conflict` state, no state library** — React state + a small context (`src/lib/store.tsx`).

---

## Development dependencies (`devDependencies`)

| Package | Version | Purpose |
|---|---|---|
| `typescript` | `5.9.3` | Type checking across client, API routes, DB schema and tests. |
| `@types/node` | `22.19.15` | Node type definitions (crypto, fs, path in server code). |
| `@types/react` | `19.2.14` | React type definitions, version-matched to `react` 19.2.6. |
| `@types/react-dom` | `19.2.3` | React DOM type definitions, version-matched to `react-dom`. |
| `@types/qrcode` | `1.5.6` | Types for the `qrcode` package. |
| `tailwindcss` | `4.1.17` | Utility CSS (v4 CSS-first config — no `tailwind.config.js`). |
| `@tailwindcss/postcss` | `4.1.17` | Tailwind v4 PostCSS plugin wired through `postcss.config.mjs`. |
| `postcss` | `8.5.8` | PostCSS pipeline host required by the Tailwind plugin. |
| `eslint` | `9.39.4` | Linter (flat config via `eslint.config.mjs`). |
| `eslint-config-next` | `16.2.6` | Next.js lint rules; version pinned to match `next` exactly. |

---

## Version compatibility notes
- `next`, `eslint-config-next`: **pinned identical** (`16.2.6`) — mismatched majors cause lint/type conflicts.
- `react` / `react-dom` / `@types/react` / `@types/react-dom`: **all 19.2.x** — kept in lockstep.
- `tailwindcss` + `@tailwindcss/postcss`: **identical** (`4.1.17`) — Tailwind v4 requires the matching plugin.
- TypeScript is capped at `5.9.3`, which Next 16 fully supports.

## Install & verify
```bash
npm install          # installs exact versions from package.json + package-lock.json
npm ls --depth=0     # confirm installed top-level versions
npm run lint         # 0 errors
npx vitest run       # 23/23 tests
npm run typecheck    # clean
npm run build        # production build
```

## Adding a new dependency
1. Confirm there is no small hand-rolled solution (most of this codebase has none).
2. Check: actively maintained, MIT/Apache/ISC licensed, no native build step, React 19 compatible.
3. Install with `npm install <pkg>` (never edit `package.json` by hand) and re-run the full verify sequence above.
4. Document it in this file with version, purpose and usage location.
