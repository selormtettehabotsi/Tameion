# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tameion — a library management system for KNUST. Three-part repo: `server/` (Express + PostgreSQL, CommonJS), `client/` (React 18 + TypeScript + Vite + Tailwind), and a root workspace that owns only lint/format tooling. Each of `server/` and `client/` has its own `package.json` and `node_modules`; the root `package.json` is **not** a workspace root and does not install them.

## Commands

Root (lint/format across both packages):

```bash
npm run lint          # eslint . + client tsc --noEmit
npm run format        # prettier --write
```

Server (`cd server`):

```bash
npm run dev           # node --watch index.js  (port 5000)
npm test              # all Jest projects; integration tests self-skip without DATABASE_URL
npm run test:unit     # unit project only, no DB
DATABASE_URL=postgres://postgres:postgres@localhost:5432/alms_test npm run test:integration
npx jest --selectProjects integration -t "returns seeded books"   # single test by name
npx jest tests/integration/books.test.js --runInBand --forceExit  # single file
npm run migrate:up    # node-pg-migrate, migrations/ dir
```

Client (`cd client`):

```bash
npm run dev           # Vite on 5173, proxies /api → VITE_API_URL or localhost:5000
npm run build         # tsc && vite build
npx tsc --noEmit      # typecheck only
```

Docker (repo root) — `docker compose up --build` brings up db + server + client; `docker compose down -v` also wipes the volume. Note the dev compose file mounts `server/src/db/schema.sql` and `seed.sql` as Postgres init scripts, so **schema changes in dev only take effect after `down -v`**. Credentials and host ports come from the root `.env` (see `.env.example`) with working defaults.

Verification scripts (all require the stack to be up, except the image audit):

```bash
bash scripts/smoke.sh          # every route's status, CSRF flow, role guards
bash scripts/diff-schema.sh    # proves the two schema definitions match
npm run verify:images          # every image URL returns HTTP 200
```

CI (`.github/workflows/ci.yml`) runs eslint with `--max-warnings 0` in both packages, so a `no-unused-vars` warning fails the build.

## Architecture

### Two parallel schema definitions — keep in sync

`server/src/db/schema.sql` (+ `seed.sql`) is what Docker and the Jest `globalSetup` (`tests/setup.js`) actually execute. `server/migrations/001_initial-schema.js` is the node-pg-migrate equivalent for production. **Any table/column change must be made in both places**, or tests and prod drift apart. Neither is the source of truth — run `bash scripts/diff-schema.sh` after any schema edit; it applies each definition to a scratch database and diffs the live catalogs.

Two gotchas that script exists to catch: node-pg-migrate serialises a JS numeric default (`1.00`) as `1`, so use `pgm.func('1.00')` to match SQL exactly; and it is easy to add a table to one file only (`audit_log` was missing from the migration for a long time).

### App factory pattern

`server/src/app.js` exports `createApp({ enableRateLimit, enableCsrf })`; `index.js` calls it with defaults and also owns the two scheduled jobs (mark loans overdue, expire reservations) that run at startup and every 15 minutes. Tests call `createApp({ enableRateLimit: false, enableCsrf: false })` — see `tests/helpers/app.js`. Anything that must be exercised by tests belongs in `app.js`, not `index.js`.

### Auth and CSRF

Session-based via `express-session` + `connect-pg-simple` (`session` table). On login, `req.session.user = { id, name, role, knust_id, isStaff, emailVerified }` and a fresh `req.session.csrfToken` is generated. Role guards live in `middleware/auth.js`: `requirePatron` = student|faculty|postgraduate, `requireStaff` = librarian|admin.

CSRF is a session-token double-submit: the client reads the token from the `/auth/login` or `/auth/me` response and `client/src/lib/api.ts` attaches it as `X-CSRF-Token` on every request. `/api/patron`, `/api/books`, `/api/admin` are fully protected; under `/api/auth` only `/login`, `/forgot-password`, `/reset-password`, `/verify-email` are exempt (register is **not** — deliberately). New non-GET endpoints outside those four paths need a client that carries the token.

Anonymous visitors hit neither `/auth/login` nor `/auth/me`, so they hold no token — anything they can POST (today just `/auth/register`) must call `ensureCsrfToken()` in `api.ts` first, which fetches one from `GET /auth/csrf-token`. Note that endpoint returns the token as `data.token`, not `data.csrfToken`.

The rate limiters in `middleware/rateLimit.js` `skip` under `NODE_ENV=test`: `authLimiter` is mounted at module scope inside `routes/auth.js`, so the `createApp({ enableRateLimit: false })` switch cannot reach it and a full suite run would otherwise trip the 10-request auth limit.

### API response envelope

Every endpoint returns `{ success, data, message }`, and `client/src/lib/api.ts` throws the parsed body on non-2xx. Keep the shape — the whole client depends on it, and types live in `client/src/types.ts` mirrored per endpoint.

### Server route layout

Four routers: `auth.js`, `patron.js`, `books.js`, `admin.js`. `admin.js` is ~1000 lines and holds every staff operation (members, books, loans/checkout/return/renew, fines, reservations, staff, branches, reports, audit log, CSV import/export). Conventions inside it:

- Multi-step writes take a client from the pool and use explicit `BEGIN`/`COMMIT`/`ROLLBACK` (checkout, return, fine payment).
- Search inputs are passed through a local `escapeLike()` that escapes `%`, `_`, `\` before building `ILIKE` patterns — both `admin.js` and `books.js` define their own copy.
- Staff mutations call `auditFromReq(req, action, entityType, entityId, details)` from `lib/audit.js`; it is fire-and-forget and swallows its own errors.
- Overdue fines are computed on return at a hardcoded `ratePerDay = 1.00` GHS.

Request bodies are validated with Zod schemas defined centrally in `middleware/validate.js` (not next to the routes) and applied as `validate(schema)`.

### Client

`main.tsx` wraps the app in `AuthProvider` + `ToastProvider` + `ErrorBoundary`. `AuthContext` is the single source of truth for the session: `login()` calls the API then re-fetches `/auth/me` for the full user. Route protection is `ProtectedRoute.tsx`; admin pages sit under `pages/admin/` behind `AdminLayout`. All network access goes through the single `api` object in `lib/api.ts` — add endpoints there rather than calling `fetch` from components (the two CSV export helpers are the intentional exceptions, since they return blobs).

### Design system

Tokens are declared as CSS custom properties in `src/index.css` (colour, radius, elevation, spacing, a 1.200 type scale, motion) and mapped into `tailwind.config.js`. **Use the token utilities — `p-lg`, `rounded-md`, `shadow-sm`, `text-2xs`, `bg-success-container` — never raw hex or pixel values.** Both themes must work: every colour has a `.dark` counterpart.

Icons are inline SVG via `components/Icon.tsx` (Lucide geometry, `currentColor`). There is no icon webfont and no emoji — add a glyph to the `paths` registry rather than reaching for either.

Shared UI lives in `components/ui/` (`Button`, `Input`, `Select`, `Badge`, `Card`, `Alert`) plus `Avatar`, `BookCover`, `EmptyState`, `StatCard`, `Modal`. `Modal` already handles focus trapping and Escape — use it instead of hand-rolling a dialog.

### Imagery

All photography comes from `src/lib/images.ts`, which is served from the Pexels CDN and constrained by the CSP's `img-src`. Covers and avatars are picked by a hash of the ISBN / KNUST id so they stay stable per record. **Any photo id added there must be verified with `npm run verify:images` before committing**, and any new image host must be added to the CSP in both `client/index.html` and `client/nginx.conf`.

## Seeded test accounts

`STU-2024001` (student), `FAC-2024010` (faculty), `LIB-001` (librarian) — all `password123`. The student is seeded with active loans, an overdue book, a reservation, and a fine balance.
