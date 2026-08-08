const COVER_BASE = 'https://covers.openlibrary.org/b/isbn';

export function coverUrl(isbn: string, size: 'S' | 'M' | 'L' = 'M') {
  const clean = isbn.replace(/-/g, '');
  return `${COVER_BASE}/${clean}-${size}.jpg`;
}
