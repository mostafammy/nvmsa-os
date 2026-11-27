import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({
  children,
  className = 'bg-white/[0.07] text-ink-soft border-line-strong',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 font-mono text-[12px] font-medium leading-none ${className}`}
    >
      {children}
    </span>
  );
}
