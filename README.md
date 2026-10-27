# ToolHub — 31 Free Online Tools

A complete, privacy-first all-in-one tools platform: calculators, text tools, developer utilities, color/design tools, image tools and finance tools in an original blue-themed, dark-mode-ready interface.

> **Stack note:** This implementation runs as a full-stack Next.js (App Router) + React + TypeScript application: the "backend" is modular REST route handlers under `src/app/api/*`, and persistence uses MongoDB through the official Node.js driver. Each user document embeds favorites and preferences for atomic, user-scoped operations while preserving validated requests, hashed-password auth, and HttpOnly signed session cookies.

## Features
- **31 real tools**, all driven by a single central registry (`src/lib/registry.ts`) — homepage, catalog, categories, search, favorites, recents and related tools all read from it.
- **Local-first processing:** calculators, text, dev, design and image tools run 100% in the browser. Files are never uploaded; passwords are never transmitted.
- **Accounts (optional):** register/login with scrypt-hashed passwords + signed HttpOnly session cookie; favorites sync across devices. Guests use local storage. All tools work without an account.
- **Live currency conversion** via the free keyless open.er-api.com service through a caching server proxy (`/api/currency`) — source + update time always displayed; errors shown honestly, rates never invented.
- Light/dark/system theme (persisted, system-aware), WCAG-conscious focus states, 44px+ touch targets, semantic HTML, reduced-motion support.

## The 31 tools
| Category | Tools |
|---|---|
| Calculators & Dates | Basic Calculator, Percentage, Unit Converter, Age, Date Difference, Countdown |
| Text | Word Counter, Case Converter, Lorem Ipsum, Whitespace Cleaner, Text Diff |
| Developer | JSON Formatter, Base64, UUID Generator, URL Encoder, Regex Tester, Color Converter, Password Generator, Password Strength |
| Color & Design | Color Picker, Palette Generator, Font Pairing |
| Image | Compressor, Resizer, Format Converter, Watermark Remover, Images→PDF |
| Finance & Utility | Tip Calculator, EMI Calculator, Currency Converter, QR Generator |

## Design system & UX architecture (Inspired by TinyWow & 10015.io)
- **Visual identity**: Restrained one-accent palette — neutral slate surfaces in light and dark themes with a single electric blue accent (`#2563EB` light / `#3B82F6` dark), selective glassmorphism (`backdrop-filter: blur(16px)`), fine borders, and refined DM Sans typography. The hero deliberately avoids extra hues: no gradients, glows, or multi-color tints — blue marks accents only, everything else is neutral ink.
- **Fast discovery (TinyWow style)**: Prominent instant search combobox with match highlighting, live keyboard navigation, instant category tabs on the homepage with live tool count badges, and popular tool shortcuts.
- **Structured domain grouping (10015.io style)**: Tools organized by domain (Calculators, Text, Developer, Design, Image, Finance), curated workflow speed packs (Developer Essentials, Image & Media Studio, Daily Math & Finance), and clean category directory cards.
- **ToolCard design**: Compact, scannable cards with category badges, category-tinted icon halos, favorite pinning, and smooth hover micro-elevations.
- **Tool workspaces**: Distraction-free utility layout with breadcrumbs, category indicator, favorite toggle, client-side privacy indicator, and related tools recommendations.
- **Consistency system**: A shared type scale (`.eyebrow-label` → `.section-title` → `.card-title`), reusable `SectionHeader` and `EmptyState` components used on every listing page, one spacing rhythm (`space-y-14/16`, 4/5px card gaps), and identical hover/active/disabled/focus states across `.btn-primary`, `.btn-ghost`, `.chip`, `.input`, and cards.
- **Accessibility & responsiveness**: WCAG 2.2 AA contrast tuning in both themes (dark-mode badge/chip/button fills were lightened to pass 4.5:1 for small text), `aria-current` page indicators in the nav, card-level focus rings via `:has(:focus-visible)`, whole-card click surfaces with keyboard-operable favorite buttons, 44px+ touch targets, semantic landmarks, and `prefers-reduced-motion` support with no horizontal overflow down to 320px.

## Project structure
```
src/
├── app/            # Pages (home, tools, categories, search, favorites, recent, auth, privacy, terms)
│   └── api/        # REST backend: auth/*, favorites, preferences, currency, health
├── components/     # UI shell + tool components (grouped by category)
├── db/             # MongoDB document types, connection, indexes, and health probe
└── lib/            # registry.ts (tool catalog), logic.ts (pure tool logic), auth.ts, store.tsx
```

## Prerequisites
- Node.js 20+, npm
- MongoDB (local or Atlas) for accounts/favorites sync — tools and guest favorites work without it.

## Setup & run
```bash
npm install
cp .env.example .env        # set MONGODB_URI, MONGODB_DB, and AUTH_SECRET
npm run dev                 # http://localhost:3000
```

## Commands
```bash
npm run build               # production build
npm start                   # production server
npm run typecheck           # TypeScript check
npx vitest run              # unit tests (logic, registry, conversions, dates…)
npm run lint                # ESLint
```

## Dependencies
All declared packages, exact versions, rationale and usage are documented in **[DEPENDENCIES.md](./DEPENDENCIES.md)**. Summary: `next` + `react`/`react-dom` (framework), `mongodb` + `dotenv` (persistence and configuration), `lucide-react` (icons), `qrcode` and `jspdf` (tool features), and `vitest`/Playwright (tests).

## Testing & verification (actual results)
| Check | Command | Result |
|---|---|---|
| Unit tests | `npx vitest run` | **26/26 passed** — calculator arithmetic, unit/temperature conversion, date & leap-year cases, text transforms/diff, JSON, Unicode Base64, UUID v4, colors, password strength, EMI/tip math, local image inpainting, 31-tool registry, search & category filtering |
| Lint | `npm run lint` | **0 errors** (7 warnings: pre-existing `<img>` suggestions for blob/QR previews) |
| Type generation | `npx next typegen` | passed |
| Type check | `npm run typecheck` | passed |
| Production build | `npm run build` | passed — all pages + 31 tool routes generated |
| Runtime health | `build_and_start` → `/api/health` | `{"ok":true}` |

These are the checks that were actually executed in this environment; no other result is claimed.

## Environment
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (local MongoDB or Atlas) |
| `MONGODB_DB` | Database name; defaults to `app_db` |
| `AUTH_SECRET` | Signs session cookies — long random value in production |
No paid services are required. Currency uses the free open.er-api.com endpoint; no API key needed.

## API endpoints
- `GET /api/health` — health + DB check
- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
- `GET|POST|DELETE /api/favorites` — user-scoped (user id always from session, never client)
- `GET|PUT /api/preferences` — theme preference
- `GET /api/currency?from=USD&to=EUR&amount=100` — cached live-rate proxy

## Adding a new tool
1. Implement pure logic in `src/lib/logic.ts` (+ tests in `logic.test.ts`).
2. Build the component in the matching `src/components/tools-*.tsx` file.
3. Register metadata in `src/lib/registry.ts` (unique id/slug, category, keywords, icon, `status: "published"`) and map the slug in `src/components/ToolPage.tsx`.
4. It automatically appears in the catalog, categories, search, favorites and related tools.

## Privacy behavior
- Tool inputs/files/passwords: processed locally, never uploaded or logged.
- Recently used: tool slugs only, max 12, on-device only.
- Favorites: on-device for guests; embedded in the user's MongoDB document when logged in.
- Passwords: scrypt-salted hashes only; sessions are signed HttpOnly cookies (SameSite=Lax, Secure in production).

## Known limitations
- Auth/favorites sync need a reachable MongoDB (`MONGODB_URI`); without one, API auth returns a clear 503 and the UI explains it — all tools + guest storage keep working.
- Image formats are limited to browser Canvas support (PNG/JPEG/WebP); JPEG flattens transparency onto white. Watermark Remover uses local neighboring-pixel healing, not generative AI: it works best for small marks over smooth or repeating backgrounds, may leave artifacts on detailed scenes, and scales images above 8 MP for responsive editing.
- Font Pairing previews use widely available system font stacks so previews match what you can actually ship.
- Currency rates depend on the free third-party provider; outages surface as errors, never fabricated numbers.
