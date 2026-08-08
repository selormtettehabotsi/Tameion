import { useState } from 'react';
import { coverFallback } from '../lib/images';

interface Props {
  isbn: string;
  title: string;
  /** Publisher artwork stored on the book record, if any. */
  coverUrl?: string | null;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Book artwork with a two-step fallback:
 *   1. the cover_url stored on the record
 *   2. a photographic stand-in chosen deterministically from the ISBN
 * Both are real photographs, so a book never renders as an empty box.
 */
export default function BookCover({
  isbn,
  title,
  coverUrl,
  width = 400,
  height = 600,
  className = '',
}: Props) {
  const fallback = coverFallback(isbn, width, height);
  const [src, setSrc] = useState(coverUrl || fallback);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-surface-container ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface-container-high" />}
      <img
        src={src}
        alt={`Cover of ${title}`}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          // Stored artwork failed — drop to the verified photographic fallback.
          if (src !== fallback) setSrc(fallback);
          else setLoaded(true);
        }}
        className={`h-full w-full object-cover transition-opacity duration-normal ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
