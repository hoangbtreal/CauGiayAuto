import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}: ButtonProps) {
  let variantClass = '';
  if (variant === 'primary') variantClass = 'bg-[var(--color-brand-primary)] text-white hover:opacity-90';
  if (variant === 'secondary') variantClass = 'bg-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]';
  if (variant === 'ghost') variantClass = 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]';
  if (variant === 'outline') variantClass = 'bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)]';

  let sizeClass = '';
  if (size === 'sm') sizeClass = 'px-3 py-1.5 text-xs';
  if (size === 'md') sizeClass = 'px-4 py-2 text-sm';
  if (size === 'lg') sizeClass = 'px-6 py-3 text-base';

  return (
    <button 
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
