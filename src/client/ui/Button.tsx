import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-ink font-semibold border border-brand-glow/50 shadow-[0_8px_24px_-8px_rgb(229_162_36/0.55),inset_0_1px_0_rgb(255_255_255/0.35)] hover:bg-brand-strong hover:border-brand-glow disabled:bg-brand/40 disabled:text-brand-ink/60 disabled:shadow-none',
  secondary:
    'bg-elevated text-ink border border-line-strong shadow-[inset_0_1px_0_rgb(255_241_214/0.05)] hover:border-brand-glow/45 hover:bg-white/[0.08] disabled:opacity-45',
  danger:
    'bg-red-700 text-white border border-red-400/30 hover:bg-red-600 disabled:bg-red-900/50 disabled:text-red-200/60',
  ghost:
    'bg-transparent text-ink-soft hover:bg-white/[0.08] hover:text-ink disabled:opacity-45',
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
      className={`inline-flex select-none items-center justify-center gap-2 whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-[var(--ease-ui)] [@media(hover:hover)]:hover:-translate-y-px active:translate-y-px active:scale-[0.97] active:duration-75 cursor-pointer disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
