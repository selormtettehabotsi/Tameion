import type { ReactNode } from 'react';
import { emptyStateImage, type EmptyStateKind } from '../lib/images';

interface Props {
  kind: EmptyStateKind;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ kind, title, description, action, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center px-lg py-xl text-center ${className}`}>
      <img
        src={emptyStateImage(kind)}
        alt=""
        width={600}
        height={400}
        loading="lazy"
        decoding="async"
        className="mb-lg h-32 w-full max-w-[260px] rounded-md object-cover opacity-90 sm:h-40"
      />
      <h3 className="text-base font-semibold text-on-surface">{title}</h3>
      {description && <p className="mt-2xs max-w-sm text-sm text-on-surface-variant">{description}</p>}
      {action && <div className="mt-md">{action}</div>}
    </div>
  );
}
