import { useState } from 'react';
import { avatarFor } from '../lib/images';

interface Props {
  /** Stable key (KNUST id) — decides which portrait a member gets. */
  seed: string;
  name: string;
  /** Stored portrait, if the member has one. Falls back to a seeded photo. */
  src?: string | null;
  size?: number;
  className?: string;
}

/** Initials shown only if both the stored and fallback photos fail to load. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Avatar({ seed, name, src, size = 40, className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  const url = src || avatarFor(seed, size * 2);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-on-primary-container ${className}`}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <span className="text-2xs font-semibold" aria-hidden="true">
          {initials(name)}
        </span>
      ) : (
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}
