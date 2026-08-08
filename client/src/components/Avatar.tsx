import { useState, useEffect } from 'react';

interface Props {
  /** Stable key (KNUST id) — decides the initials colour. */
  seed: string;
  name: string;
  /** Endpoint serving this person's uploaded picture, if they have one. */
  src?: string | null;
  size?: number;
  /** Bump to force a re-fetch after the picture changes. */
  version?: number;
  className?: string;
}

/**
 * A person's profile picture.
 *
 * Falls back to their initials — never to a stock photograph of somebody else,
 * which would misrepresent who the account belongs to.
 */

/** First letters of the first and last name parts. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministic colour per person, so the same account always looks the same.
 * Pairs are drawn from the design tokens and all meet contrast in both themes.
 */
const PALETTE = [
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-success-container text-on-success-container',
  'bg-warning-container text-on-warning-container',
];

function hash(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

export default function Avatar({ seed, name, src, size = 40, version = 0, className = '' }: Props) {
  const [failed, setFailed] = useState(false);

  // A new src (or a new version after an upload) deserves a fresh attempt.
  useEffect(() => setFailed(false), [src, version]);

  const tone = PALETTE[hash(seed || name) % PALETTE.length];
  const showImage = Boolean(src) && !failed;
  const url = src && version ? `${src}${src.includes('?') ? '&' : '?'}v=${version}` : src;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${tone} ${className}`}
      style={{ width: size, height: size }}
      title={name}
    >
      {showImage ? (
        <img
          src={url ?? undefined}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="font-semibold leading-none"
          style={{ fontSize: Math.max(10, Math.round(size * 0.38)) }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
