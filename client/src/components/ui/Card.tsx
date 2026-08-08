import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Removes internal padding — use when the card wraps a table or list. */
  flush?: boolean;
}

export default function Card({ children, flush = false, className = '', ...rest }: Props) {
  return (
    <div
      {...rest}
      className={`bg-surface-container-lowest border border-surface-container-high rounded-lg shadow-sm ${
        flush ? 'overflow-hidden' : 'p-lg'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-md border-b border-surface-container-high px-lg py-md">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-on-surface">{title}</h2>
        {description && <p className="mt-3xs text-xs text-on-surface-variant">{description}</p>}
      </div>
      {action}
    </div>
  );
}
