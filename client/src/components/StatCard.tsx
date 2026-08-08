import Icon, { type IconName } from './Icon';

export type StatTone = 'default' | 'success' | 'danger' | 'warning' | 'info';

const accents: Record<StatTone, string> = {
  default: 'bg-surface-container-high text-on-surface-variant',
  success: 'bg-success-container text-on-success-container',
  danger: 'bg-danger-container text-on-danger-container',
  warning: 'bg-warning-container text-on-warning-container',
  info: 'bg-primary-container text-on-primary-container',
};

interface Props {
  label: string;
  value: string | number;
  icon: IconName;
  tone?: StatTone;
  hint?: string;
  loading?: boolean;
}

export default function StatCard({ label, value, icon, tone = 'default', hint, loading = false }: Props) {
  return (
    <div className="flex items-start gap-md rounded-lg border border-surface-container-high bg-surface-container-lowest p-md shadow-sm">
      <span className={`grid h-10 w-10 place-items-center rounded-md ${accents[tone]}`}>
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
        {loading ? (
          <div className="mt-2xs h-7 w-16 animate-pulse rounded-xs bg-surface-container-high" />
        ) : (
          <p className={`mt-3xs text-2xl font-bold ${tone === 'danger' ? 'text-error' : 'text-on-surface'}`}>{value}</p>
        )}
        {hint && !loading && <p className="mt-3xs text-2xs text-on-surface-variant">{hint}</p>}
      </div>
    </div>
  );
}
