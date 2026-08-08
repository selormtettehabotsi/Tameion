# Decisions

Choices made autonomously during the UI rebuild, recorded here rather than
raised as questions. Newest section last.

## Repository

**Initialised a git repository.** The task asked for small commits; the
directory was not a repo. `git init` plus a baseline commit of the code exactly
as received, so every later change is a reviewable diff.

**`.claude/` is git-ignored.** `.claude/settings.json` contains a live
`ANTHROPIC_AUTH_TOKEN`. It is now ignored and was never committed. **That token
was on disk in plaintext before this work started and should be rotated** — it
is outside anything the code changes can fix.

## Styling

**Kept Tailwind; did not introduce a new styling library.** The project already
had a Material-3-style token layer (CSS custom properties in `index.css` mapped
into `tailwind.config.js`). Extending that was cheaper and less risky than
replacing it, and it satisfies the "real design system" requirement directly.

**Design tokens are the single source of truth.** Added radius, elevation,
spacing, a 1.200 minor-third type scale, motion tokens and status accents
(`success` / `warning` / `danger`) as CSS custom properties, then mapped every
one into the Tailwind theme. Components use `rounded-md`, `shadow-sm`, `p-lg`,
`text-2xs` — never raw pixel or hex values. The status tokens replaced hex
literals (`#dcfce7`, `#166534`, `#fee2e2`, `#991b1b`) that had been pasted
inline across a dozen components and did not adapt to dark mode.

**Icons are inline SVG with Lucide geometry.** `components/Icon.tsx` holds a
~50-glyph registry drawn with `currentColor`. This replaced the Material
Symbols **webfont** (90 usages). Icon fonts are not emoji, but they are also
not inline SVG, and the constraint asked for official SVG sources. Dropping the
font also removed a render-blocking Google Fonts request and narrowed the CSP.

**British-ish copy and `en-GB` dates.** KNUST is Ghanaian; `DD/MM/YYYY` reads
correctly there, and "catalogue" matches local usage.

## Imagery

**Pexels, not Unsplash.** Both allow hotlinking. Pexels search pages render
CDN URLs in server-side HTML, so real photo IDs could be harvested and verified
rather than guessed. Unsplash's are behind client-side rendering.

**Photo IDs live in one module (`client/src/lib/images.ts`).** Covers and
avatars are selected by an FNV-1a hash of the ISBN / KNUST id, so a given record
always shows the same picture across reloads and pages.

**`cover_url` and `avatar_url` are left NULL in the seed data.** The columns
exist so staff can attach real artwork through the admin UI, but seeding them
would put URLs into SQL where `scripts/verify-images.mjs` cannot see them. Every
image the app can render therefore comes from the audited module, and the audit
covers 100% of them. The client falls back to the hashed photo whenever a
stored URL is absent or fails to load.

**Image URLs are validated as absolute `https://` on the server.** A shared Zod
refinement rejects `javascript:`, `data:` and plain `http://`, so a stored
attribute can never become an injection vector or mixed content.

**Imagery is now bundled, not hotlinked.** The 28 photos were downloaded into
`client/public/img/` and `images.ts` emits local paths. The app no longer
depends on a third-party CDN at runtime, renders offline and in CI, and the
audit is a filesystem check rather than 196 network requests.
`client/public/img/SOURCES.md` records each file's Pexels id and stored size.
Total cost: 1.3 MB, served from our own origin with a one-year immutable cache
header.

**Each photo is stored at one size and scaled with CSS.** The CDN could
generate arbitrary dimensions on demand; local files cannot. Rather than ship
seven variants of each photo, `IMAGE_SIZES` documents one canonical size per
role and components pass `width`/`height` as intrinsic attributes so layout
space is still reserved.

**CSP `img-src` is `'self' data: https:`.** Bundled imagery is same-origin, so
the Pexels host is gone. `https:` remains allowed because staff can attach
publisher artwork from an arbitrary host through a book's `cover_url` — that is
a real product feature, and the server already constrains it to absolute
`https`. Narrowing to `'self'` would silently break it (the component would
fall back to the local photo on error). `http:` stays blocked, so mixed content
is still impossible.

## Database

**Added `books.cover_url` and `members.avatar_url`** (both `varchar(500)`,
nullable) plus `idx_books_title` / `idx_books_author`, applied identically to
`server/src/db/schema.sql` and `server/migrations/001_initial-schema.js`.

**Neither schema file is treated as the source of truth.**
`scripts/diff-schema.sh` applies each to a scratch database and diffs the live
catalogs (columns, checks, keys, indexes). This surfaced two pre-existing
drifts, both fixed: `audit_log` was missing from the migration entirely, and
`rate_per_day`'s default serialised as `1` from the migration versus `1.00`
from the SQL.

## Server

**Rate limiters skip under `NODE_ENV=test`.** `authLimiter` is mounted at module
scope in `routes/auth.js`, so `createApp({ enableRateLimit: false })` could
never reach it, and a full suite run exceeds 10 auth requests — one test was
failing with 429 instead of 409 before any of this work. Production behaviour is
unchanged.

**Compose waits for Postgres to be healthy.** The `index.js` schedulers ran
immediately at boot and logged `ECONNREFUSED` on every cold start. Fixed with a
db healthcheck (`pg_isready -h 127.0.0.1`, forcing TCP so the socket-only init
server cannot report ready before `seed.sql` runs) plus `depends_on:
service_healthy`, and a `waitForDatabase()` guard so the jobs are also safe
outside Docker.

**Server logging goes through pino.** The four routers used `console.error`
while `lib/logger.js` already existed; they now use `logger.error({ err }, ...)`.

## Two bugs found while rebuilding registration

Both were verified against the running server before and after the fix:

1. The register form never sent `user_type`, which `registerSchema` requires —
   **every registration failed with 400.** The form now has a member-type select.
2. Anonymous visitors hold no CSRF token (they never hit `/auth/login` or
   `/auth/me`), but `/auth/register` is deliberately *not* CSRF-exempt — so the
   request would have been rejected with 403 even with a valid body.
   `api.register` now fetches a token from `/auth/csrf-token` first.

The member edit form also offered an "inactive" status that the server's enum
rejects, and omitted "postgraduate"; its options now mirror `memberUpdateSchema`.

## Security

**No DOMPurify.** It was offered as a fallback for unavoidable injection. There
is none to guard: no `innerHTML`, no `dangerouslySetInnerHTML`, no `eval`, no
`new Function`, no `document.write`, no inline handlers. Adding a sanitiser
would be dead weight.

**`'unsafe-inline'` remains in `style-src`.** React writes inline `style`
attributes for the progress bars and Vite injects the stylesheet. `script-src`
has no `unsafe-inline` and no `unsafe-eval`.

**A 401 in the browser console on first load is expected.** `AuthContext` probes
`/auth/me`, which correctly returns 401 for anonymous visitors.

## Testing

**`scripts/smoke.sh` is kept alongside the Jest suite, not replaced by it.**
The Jest tests are what CI enforces; the smoke script still earns its place as
a check against the *running Docker stack* (real nginx, real CSP headers, real
proxying), which supertest cannot cover because it drives the Express app
in-process.

**CSRF is tested in its own file.** Every other suite builds the app with
`enableCsrf: false`; `tests/integration/csrf.test.js` is the one place that
turns it on, so the double-submit flow and the four exempt paths are actually
exercised rather than assumed.

**Every new test was negative-controlled.** Because the same author wrote the
feature and its test, each was verified to fail when the feature is broken:
removing the `activeMembers` filter failed 3 tests, dropping the `https`
refinement failed 21, and making `csrfProtect` a no-op failed 5. A test that
cannot fail is not coverage.

**Audit-log writes are not asserted.** `auditFromReq` is deliberately
fire-and-forget, so asserting on the row would be a race. Testing it properly
needs a seam that does not exist yet; a flaky test would be worse than none.

## Proxy trust

**`trust proxy` is set to 1 (override with `TRUST_PROXY`).** Both compose files
run nginx in front of Express. With the Express default (`false`),
express-rate-limit keyed every proxied request on the *nginx container's* IP:
all users shared one bucket, so a single client could exhaust the 10-request
auth limit for the entire user base, and `req.ip` recorded the proxy rather
than the caller in the audit log. It also emitted an
`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` validation error on every proxied request.

Trusting exactly one hop fixes all three without letting a client spoof
`X-Forwarded-For` (which `trust proxy: true` would allow). This only surfaced
once a real browser exercised the app through nginx — curl straight to :5000
never sets the header, which is why the earlier verification runs missed it.

## Profile pictures

**Nobody is shown a stranger's face any more.** Avatars previously defaulted to
a stock photograph of a real person chosen by hashing the account id, which
presented an unrelated human as if they were the member. The default is now the
person's **initials** on a deterministic colour from the token palette, and the
ten `avatar-*.jpg` files have been deleted.

**Anyone with an account can upload their own picture** at `/profile` —
patrons and staff alike, through one set of routes (`GET`/`POST`/`DELETE
/api/auth/avatar`). The session decides which table is written, so the owner is
never taken from the request body.

**Uploads go through the existing JSON body parser, not a multipart parser.**
The browser centre-crops and re-encodes the image to a 256x256 JPEG on a
canvas, then posts it as base64. That avoids a new dependency (multer/busboy),
keeps payloads to a few tens of KB, and means no image decoding happens on the
server.

**Pictures are stored in Postgres as `bytea`, not on disk.** Files would need a
persistent volume in both compose files and a backup story of their own; at a
few tens of KB per person the bytes sit naturally beside the row they belong
to and are covered by an ordinary database backup. `avatar_data` is never
serialised into JSON — the member detail endpoint strips it and returns
`has_avatar` instead, and images are served only by the dedicated routes.

**The declared content type is never trusted.** `decodeAvatar()` checks magic
bytes against the declared mime, so an SVG (which can carry script), an HTML
document or a renamed executable is rejected even if it claims to be a JPEG.
SVG is not an accepted type at all. Verified through the running stack, not
just in unit tests.

**Avatars are served `Cache-Control: private, no-cache`.** A profile picture is
personal data and must not be held in a shared proxy cache; `no-cache` also
means a replaced picture shows up immediately rather than after a TTL.

**`avatar_url` is kept alongside the uploads.** Staff can still point a member
at externally hosted artwork, and that path was already built and tested. An
uploaded picture takes precedence over it.
