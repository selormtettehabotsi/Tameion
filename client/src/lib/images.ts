/**
 * Photographic imagery, bundled with the app.
 *
 * The files live in client/public/img and are served from our own origin, so
 * the app renders identically offline, in CI and behind a strict CSP
 * (img-src 'self'). client/public/img/SOURCES.md records where each one came
 * from; scripts/verify-images.mjs asserts every path here exists on disk.
 *
 * Each photo is stored at one canonical size and scaled with CSS, so these
 * helpers take no dimensions — pass width/height to the <img> as intrinsic
 * attributes instead, to reserve layout space.
 */

const IMG = '/img';

/* ── Intrinsic pixel dimensions of the stored files ─────────────────── */

export const IMAGE_SIZES = {
  hero: { width: 1600, height: 900 },
  auth: { width: 1200, height: 1600 },
  cover: { width: 400, height: 600 },
  empty: { width: 600, height: 400 },
} as const;

/* ── Single-purpose imagery ─────────────────────────────────────────── */

export const HERO_IMAGE = `${IMG}/hero.jpg`;
export const AUTH_IMAGE = `${IMG}/auth.jpg`;

/* ── Book cover fallbacks ───────────────────────────────────────────── */

const COVER_FILES = [
  'cover-10027581.jpg', 'cover-10060920.jpg', 'cover-1050736.jpg', 'cover-1098656.jpg',
  'cover-11197155.jpg', 'cover-1130980.jpg', 'cover-1132577.jpg', 'cover-11839922.jpg',
  'cover-1222551.jpg', 'cover-12391379.jpg', 'cover-1301585.jpg', 'cover-13556546.jpg',
];

/* ── Empty states ───────────────────────────────────────────────────── */

const EMPTY_FILES = {
  books: 'empty-books.jpg',
  loans: 'empty-loans.jpg',
  reservations: 'empty-reservations.jpg',
  members: 'empty-members.jpg',
} as const;

export type EmptyStateKind = keyof typeof EMPTY_FILES;

/**
 * Stable non-cryptographic hash (FNV-1a) so a given book or member always
 * resolves to the same picture across reloads and across pages.
 */
function hash(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

/** Deterministic photographic stand-in for a book with no publisher artwork. */
export function coverFallback(isbn: string): string {
  return `${IMG}/${COVER_FILES[hash(isbn) % COVER_FILES.length]}`;
}

/** Illustrative photo for an empty list. */
export function emptyStateImage(kind: EmptyStateKind): string {
  return `${IMG}/${EMPTY_FILES[kind]}`;
}

/** Every distinct path this module can emit — used by the image audit script. */
export function allImageUrls(): string[] {
  return [
    HERO_IMAGE,
    AUTH_IMAGE,
    ...COVER_FILES.map((f) => `${IMG}/${f}`),
    ...Object.values(EMPTY_FILES).map((f) => `${IMG}/${f}`),
  ];
}
