import React from 'react';

type TableProps = {
  children: React.ReactNode;
  className?: string;
};

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`w-full overflow-auto border border-[var(--color-border)] rounded-md bg-[var(--color-brand-surface)] ${className}`}>
      <table className="w-full text-sm text-left text-[var(--color-text-primary)]">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="text-xs text-[var(--color-text-secondary)] uppercase bg-[var(--color-background)] border-b border-[var(--color-border)]">
      {children}
    </thead>
  );
}

export function TableRow({ children, className = '' }: TableProps) {
  return (
    <tr className={`border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-background)] transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }: TableProps) {
  return (
    <th scope="col" className={`px-6 py-3 font-medium whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }: TableProps) {
  return (
    <td className={`px-6 py-4 ${className}`}>
      {children}
    </td>
  );
}
