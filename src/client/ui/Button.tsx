import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// One button system: a solid brand pill, an outlined ink pill, a danger pill and a quiet ghost.
// Hover steps 1px up on a fine pointer, press sinks 1px and scales .985 everywhere.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] hover:bg-brand-strong disabled:bg-brand/45',
  secondary:
    'bg-surface text-ink border border-line-strong hover:border-ink/40 hover:bg-sunken/60 disabled:opacity-50',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300',
  ghost: 'bg-transparent text-ink-soft hover:bg-ink/[0.06] hover:text-ink disabled:opacity-50',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-[13px] font-medium rounded-full',
  md: 'min-h-12 px-5 text-[15px] font-medium rounded-full',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex select-none items-center justify-center gap-2 whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-[var(--ease-ui)] [@media(hover:hover)]:hover:-translate-y-px active:translate-y-px active:scale-[0.985] active:duration-75 cursor-pointer disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
