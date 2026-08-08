import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const base = 'w-full px-3 py-2 bg-surface-container-lowest rounded-md border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-on-surface';

export default function Input({ label, error, className = '', id, ...props }: Props) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">{label}</label>}
      <input id={inputId} className={`${base} ${error ? 'border-error focus:ring-error/20' : ''} ${className}`} {...props} />
      {error && <p role="alert" className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
