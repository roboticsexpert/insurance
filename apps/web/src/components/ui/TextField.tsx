import { useId, type InputHTMLAttributes } from 'react'

export function TextField({
  label,
  error,
  hint,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-strong">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
        className={`w-full rounded-2xl border bg-card px-4 py-3.5 text-base text-strong outline-none transition-colors placeholder:text-muted/50 focus:border-brand-500 ${
          error ? 'border-red-500' : 'border-line'
        } ${className}`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {!error && hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
