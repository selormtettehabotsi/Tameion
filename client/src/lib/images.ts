/**
 * Photographic imagery, served straight from the Pexels CDN over HTTPS.
 *
 * Every photo id below was harvested from Pexels search pages and then
 * curl-verified to return HTTP 200 at the exact size parameters used here.
 * If you add an id, verify it the same way before committing it.
 *
 * Pexels content is free to use and hotlinking from their CDN is supported.
 */

const CDN = 'https://images.pexels.com/photos';

/** Build a sized, compressed CDN URL for a photo id. */
function photo(id: string, slug: string, w: number, h: number): string {
  return `${CDN}/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

/* ── Single-purpose imagery ─────────────────────────────────────────── */

export const HERO_IMAGE = photo('13770425', 'library', 1600, 900);
export const AUTH_IMAGE = photo('10323192', 'library', 1200, 1600);

/* ── Book cover fallbacks ───────────────────────────────────────────── */

const COVER_IDS = [
  '10027581', '10060920', '1050736', '1098656',
  '11197155', '1130980', '1132577', '11839922',
  '1222551', '12391379', '1301585', '13556546',
];

/* ── Member avatars ─────────────────────────────────────────────────── */

const AVATAR_IDS = [
  '10417388', '10500054', '10554201', '10604063', '11395925',
  '11655430', '12311572', '12497063', '12750172', '14183123',
];

/* ── Empty states ───────────────────────────────────────────────────── */

const EMPTY_IDS = {
  books: '10180449',
  loans: '10693352',
  reservations: '11377318',
  members: '16504588',
} as const;

export type EmptyStateKind = keyof typeof EMPTY_IDS;

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
export function coverFallback(isbn: string, w = 400, h = 600): string {
  const id = COVER_IDS[hash(isbn) % COVER_IDS.length];
  return photo(id, 'book', w, h);
}

/** Deterministic portrait for a member, keyed on their KNUST id. */
export function avatarFor(key: string, size = 160): string {
  const id = AVATAR_IDS[hash(key) % AVATAR_IDS.length];
  return photo(id, 'portrait', size, size);
}

/** Illustrative photo for an empty list. */
export function emptyStateImage(kind: EmptyStateKind, w = 600, h = 400): string {
  return photo(EMPTY_IDS[kind], 'empty', w, h);
}

/** Every distinct URL this module can emit — used by the image audit script. */
export function allImageUrls(): string[] {
  return [
    HERO_IMAGE,
    AUTH_IMAGE,
    ...COVER_IDS.map((id) => photo(id, 'book', 400, 600)),
    ...AVATAR_IDS.map((id) => photo(id, 'portrait', 160, 160)),
    ...Object.values(EMPTY_IDS).map((id) => photo(id, 'empty', 600, 400)),
  ];
}
