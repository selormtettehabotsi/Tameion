import type { ReactNode } from 'react';
import Icon, { type IconName } from '../Icon';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-container-high text-on-surface-variant',
  success: 'bg-success-container text-on-success-container',
  danger: 'bg-danger-container text-on-danger-container',
  warning: 'bg-warning-container text-on-warning-container',
  info: 'bg-primary-container text-on-primary-container',
};

interface Props {
  tone?: BadgeTone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}

export default function Badge({ tone = 'neutral', icon, children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2xs whitespace-nowrap rounded-full px-xs py-3xs text-2xs font-semibold ${tones[tone]} ${className}`}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

/** Shared mapping so loan status renders identically everywhere. */
export function loanTone(status: string): BadgeTone {
  if (status === 'overdue') return 'danger';
  if (status === 'returned') return 'neutral';
  return 'success';
}
