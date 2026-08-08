import { useState } from 'react';
import { coverUrl } from '../lib/covers';

interface Props {
  isbn: string;
  title: string;
  size?: 'S' | 'M' | 'L';
  className?: string;
}

export default function BookCover({ isbn, title, size = 'M', className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-surface-container-low ${className}`}>
        <span className="material-symbols-outlined text-6xl text-outline-variant">menu_book</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-surface-container-low" />
      )}
      <img
        src={coverUrl(isbn, size)}
        alt={`Cover of ${title}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`object-cover w-full h-full transition-opacity duration-300${!loaded ? ' opacity-0' : ' opacity-100'}`}
      />
    </div>
  );
}
