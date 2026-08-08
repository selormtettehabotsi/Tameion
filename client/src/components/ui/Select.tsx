import type { SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

const base = 'w-full px-3 py-2 bg-surface-container-lowest rounded-md border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-on-surface';

export default function Select({ label, options, error, className = '', id, ...props }: Props) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && <label htmlFor={selectId} className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">{label}</label>}
      <select id={selectId} className={`${base} ${error ? 'border-error' : ''} ${className}`} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p role="alert" className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
