# ToolHub — 121 Free Online Tools

A complete, privacy-first all-in-one tools platform: calculators, text tools, developer utilities, color/design tools, image tools and finance tools in an original blue-themed, dark-mode-ready interface.

> **Stack note:** This implementation runs as a full-stack Next.js (App Router) + React + TypeScript application: the "backend" is modular REST route handlers under `src/app/api/*`, and persistence uses MongoDB through the official Node.js driver. Each user document embeds favorites and preferences for atomic, user-scoped operations while preserving validated requests, hashed-password auth, and HttpOnly signed session cookies.

## Features
- **121 real tools**, all driven by a single central registry (`src/lib/registry.ts`) — homepage, catalog, categories, search, favorites, recents and related tools all read from it.
- **Local-first processing:** calculators, text, dev, design and image tools run 100% in the browser. Files are never uploaded; passwords are never transmitted.
- **Accounts (optional):** register/login with scrypt-hashed passwords + signed HttpOnly session cookie; favorites sync across devices. Guests use local storage. All tools work without an account.
- **Live currency conversion** via the free keyless open.er-api.com service through a caching server proxy (`/api/currency`) — source + update time always displayed; errors shown honestly, rates never invented.
- Light/dark/system theme (persisted, system-aware), WCAG-conscious focus states, 44px+ touch targets, semantic HTML, reduced-motion support.

## Tool categories
| Category | Count | Primary purpose |
|---|---:|---|
| Calculators | 8 | General math, units, dates, time zones and countdowns |
| Business & Finance | 30 | Money, pricing, ROI, SaaS metrics, project costs and business planning |
| Text & Documents | 44 | Writing, cleanup, comparison, summarization, PDFs and document creation |
| Developer & Web | 24 | Code utilities, security, QR workflows, metadata, SEO and web visibility |
| Image & Design | 15 | Image editing and conversion, colors, palettes, typography and graphics |

## Design system & UX architecture (Inspired by TinyWow & 10015.io)
- **Visual identity**: Restrained one-accent palette — neutral slate surfaces in light and dark themes with a single electric blue accent (`#2563EB` light / `#3B82F6` dark), selective glassmorphism (`backdrop-filter: blur(16px)`), fine borders, and refined DM Sans typography. The hero deliberately avoids extra hues: no gradients, glows, or multi-color tints — blue marks accents only, everything else is neutral ink.
- **Fast discovery (TinyWow style)**: Prominent instant search combobox with match highlighting, live keyboard navigation, instant category tabs on the homepage with live tool count badges, and popular tool shortcuts.
- **Structured domain grouping (10015.io style)**: Tools organized into five non-overlapping domains (Calculators, Business & Finance, Text & Documents, Developer & Web, Image & Design), curated workflow speed packs, and clean category directory cards.
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
| Unit tests | `npx vitest run` | Covers calculator arithmetic, conversions, text transforms, developer utilities, the 121-tool registry, search and category filtering |
| Lint | `npm run lint` | **0 errors** (7 warnings: pre-existing `<img>` suggestions for blob/QR previews) |
| Type generation | `npx next typegen` | passed |
| Type check | `npm run typecheck` | passed |
| Production build | `npm run build` | Generates all pages and 121 tool routes |
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
