import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  children: ReactNode;
}

const variants = {
  primary: 'bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary shadow-sm',
  secondary: 'bg-surface border border-outline-variant hover:bg-surface-container-low text-on-surface',
  danger: 'bg-error hover:bg-[#991b1b] text-on-error shadow-sm',
  ghost: 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
