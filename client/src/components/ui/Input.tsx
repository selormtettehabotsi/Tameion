import type { InputHTMLAttributes } from 'react';
import Icon, { type IconName } from '../Icon';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: IconName;
}

const base =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest py-xs text-sm text-on-surface placeholder:text-on-surface-variant/70 transition-colors duration-fast focus:border-primary';

export default function Input({ label, error, icon, className = '', id, ...props }: Props) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2xs block text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
            <Icon name={icon} size={16} />
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`${base} ${icon ? 'pl-xl pr-sm' : 'px-sm'} ${error ? 'border-error' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2xs text-2xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
