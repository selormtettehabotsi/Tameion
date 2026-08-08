/**
 * Inline SVG icon set (Lucide geometry, ISC licensed).
 *
 * Replaces the Material Symbols icon font the UI previously used. Every glyph
 * is real SVG drawn with `currentColor`, so icons inherit the surrounding
 * token colour and need no webfont request. No emoji are used as icons.
 *
 * Usage:
 *   <Icon name="search" />                 decorative (aria-hidden)
 *   <Icon name="search" label="Search" />  meaningful (role="img" + title)
 */

import type { SVGProps } from 'react';

/** Paths are authored on Lucide's 24x24 grid with a 2px round stroke. */
const paths = {
  'book-open': ['M12 7v14', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'],
  book: ['M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20'],
  library: ['m16 6 4 14', 'M12 6v14', 'M8 8v12', 'M4 4v16'],
  search: ['m21 21-4.34-4.34'],
  'search-x': ['m13.5 8.5-5 5', 'm8.5 8.5 5 5', 'm21 21-4.34-4.34'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  plus: ['M5 12h14', 'M12 5v14'],
  minus: ['M5 12h14'],
  check: ['M20 6 9 17l-5-5'],
  pencil: ['M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.4 2.6a2 2 0 0 1 3 3L12 15l-4 1 1-4z'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M10 11v6', 'M14 11v6'],
  'triangle-alert': ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  'circle-alert': ['M12 8v4', 'M12 16h.01'],
  'circle-check': ['m9 12 2 2 4-4'],
  info: ['M12 16v-4', 'M12 8h.01'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'],
  'user-plus': ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M19 8v6', 'M22 11h-6'],
  'log-out': ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  sun: ['M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  banknote: ['M6 12h.01', 'M18 12h.01'],
  wallet: ['M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 10h18'],
  clock: ['M12 6v6l4 2'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54z'],
  landmark: ['M3 22h18', 'M6 18v-7', 'M10 18v-7', 'M14 18v-7', 'M18 18v-7', 'm12 2 9 7H3z'],
  bookmark: ['m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  'bookmark-plus': ['m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z', 'M9 10h6', 'M12 7v6'],
  shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'],
  'chart-bar': ['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  'trending-up': ['m22 7-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
  history: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  'graduation-cap': ['M22 10 12 5 2 10l10 5z', 'M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5'],
  star: ['m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'],
  'map-pin': ['M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z'],
  tag: ['M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.8 8.8a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z', 'M7 7h.01'],
  'layout-dashboard': ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  'id-card': ['M16 10h2', 'M16 14h2', 'M6.17 15a3 3 0 0 1 5.66 0', 'M2 5h20v14H2z'],
  'mail-check': ['M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9', 'm22 7-10 5L2 7', 'm16 19 2 2 4-4'],
  lock: ['M5 11h14v11H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  eye: ['M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0'],
  'eye-off': [
    'M10.73 5.08a10.74 10.74 0 0 1 11.21 6.57 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.45 2.49',
    'M14.08 14.16a3 3 0 0 1-4.24-4.24',
    'M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14',
    'm2 2 20 20',
  ],
  'arrow-left': ['m12 19-7-7 7-7', 'M19 12H5'],
  'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'arrow-up-down': ['m21 16-4 4-4-4', 'M17 20V4', 'm3 8 4-4 4 4', 'M7 4v16'],
  'rotate-cw': ['M21 12a9 9 0 1 1-3-6.7L21 8', 'M21 3v5h-5'],
  'book-marked': ['M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20', 'M10 2v8l3-2 3 2V2'],
  building: ['M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z', 'M10 6h4', 'M10 10h4', 'M10 14h4', 'M10 18h4'],
  inbox: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'],
} as const;

/** Icons that also need a circle element (Lucide draws these as circles). */
const circles: Partial<Record<IconName, [number, number, number][]>> = {
  search: [[11, 11, 8]],
  'search-x': [[11, 11, 8]],
  'circle-alert': [[12, 12, 10]],
  'circle-check': [[12, 12, 10]],
  info: [[12, 12, 10]],
  clock: [[12, 12, 10]],
  user: [[12, 7, 4]],
  users: [[9, 7, 4]],
  'user-plus': [[9, 7, 4]],
  sun: [[12, 12, 4]],
  banknote: [[12, 12, 2]],
  eye: [[12, 12, 3]],
};

/** Icons that also need a rect element. */
const rects: Partial<Record<IconName, [number, number, number, number, number][]>> = {
  banknote: [[2, 6, 20, 12, 2]],
  calendar: [[3, 4, 18, 18, 2]],
  lock: [[3, 11, 18, 11, 2]],
  'id-card': [[2, 5, 20, 14, 2]],
};

export type IconName = keyof typeof paths;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Pixel size; icons are square. */
  size?: number;
  /** Accessible name. Omit for decorative icons (they get aria-hidden). */
  label?: string;
}

export default function Icon({ name, size = 20, label, className = '', ...rest }: IconProps) {
  const d = paths[name];
  const circle = circles[name];
  const rect = rects[name];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      focusable="false"
      {...rest}
    >
      {label && <title>{label}</title>}
      {rect?.map(([x, y, w, h, r], i) => (
        <rect key={`r${i}`} x={x} y={y} width={w} height={h} rx={r} />
      ))}
      {circle?.map(([cx, cy, r], i) => (
        <circle key={`c${i}`} cx={cx} cy={cy} r={r} />
      ))}
      {d.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}
