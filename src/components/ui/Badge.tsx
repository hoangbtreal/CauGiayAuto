import React from 'react';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'new' | 'progress' | 'wait' | 'done';
  className?: string;
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  let bgClass = 'bg-[var(--color-border-subtle)] text-[var(--color-text-secondary)]';
  
  if (variant === 'new') bgClass = 'bg-[var(--color-status-new-bg)] text-[var(--color-status-new)]';
  if (variant === 'progress') bgClass = 'bg-[var(--color-status-progress-bg)] text-[var(--color-status-progress)]';
  if (variant === 'wait') bgClass = 'bg-[var(--color-status-wait-bg)] text-[var(--color-status-wait)]';
  if (variant === 'done') bgClass = 'bg-[var(--color-status-done-bg)] text-[var(--color-status-done)]';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass} ${className}`}>
      {children}
    </span>
  );
}
