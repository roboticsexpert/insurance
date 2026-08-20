import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

const base =
  'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 text-[0.95rem] font-semibold transition-[transform,opacity] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-[0_6px_20px_-8px_var(--color-brand-600)]',
  ghost: 'bg-transparent text-brand-600',
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}) {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      // 52px: comfortably past the 44px minimum, and the height the sticky action bar assumes.
      className={`${base} ${variants[variant]} min-h-[52px] ${className}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-label="در حال ارسال">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
