import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  // Dùng thẻ <figure> và hairline border thay vì box-shadow (Hallmark D4)
  return (
    <figure className={`card rounded-lg overflow-hidden flex flex-col ${className}`}>
      {children}
    </figure>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-4 py-3 border-b border-[var(--color-border-subtle)] ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3 className={`text-sm font-semibold text-[var(--color-text-primary)] ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`p-4 flex-1 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardProps) {
  return (
    <div className={`px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-background)] ${className}`}>
      {children}
    </div>
  );
}
