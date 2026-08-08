import type { SelectHTMLAttributes } from 'react';
import Icon from '../Icon';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

const base =
  'w-full appearance-none rounded-md border border-outline-variant bg-surface-container-lowest py-xs pl-sm pr-xl text-sm text-on-surface transition-colors duration-fast focus:border-primary';

export default function Select({ label, options, error, className = '', id, ...props }: Props) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-2xs block text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative">
        <select id={selectId} className={`${base} ${error ? 'border-error' : ''} ${className}`} {...props}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
          <Icon name="chevron-down" size={16} />
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-2xs text-2xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
