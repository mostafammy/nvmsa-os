import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className = 'bg-sunken text-ink-soft border-line' }: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 font-mono text-[12px] font-medium leading-none ${className}`}
    >
      {children}
    </span>
  );
}
