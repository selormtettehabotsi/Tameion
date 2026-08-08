import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-primary text-on-primary shadow-xs hover:bg-primary-container hover:text-on-primary-container',
  secondary: 'bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low',
  danger: 'bg-error text-on-error shadow-xs hover:opacity-90',
  ghost: 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
};

const sizes = {
  sm: 'px-sm py-2xs text-2xs gap-2xs',
  md: 'px-md py-xs text-xs gap-2xs',
  lg: 'px-lg py-sm text-sm gap-xs',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md font-semibold transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
