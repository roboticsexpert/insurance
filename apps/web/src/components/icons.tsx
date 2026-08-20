/*
 * Inline SVG rather than an icon package: the app needs a handful of glyphs, and a dependency
 * that ships thousands to use six is not a trade worth making. 24×24, stroke uses currentColor.
 */
type IconProps = { className?: string; filled?: boolean }

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const HomeIcon = ({ className, filled }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      {...stroke}
      fill={filled ? 'currentColor' : 'none'}
      d="M3.5 10.2 12 3.8l8.5 6.4V19a1.5 1.5 0 0 1-1.5 1.5h-3.5v-6h-7v6H5A1.5 1.5 0 0 1 3.5 19z"
    />
  </svg>
)

export const PolicyIcon = ({ className, filled }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      {...stroke}
      fill={filled ? 'currentColor' : 'none'}
      d="M12 3.2 19.5 6v6.1c0 4.3-3.2 7.6-7.5 9-4.3-1.4-7.5-4.7-7.5-9V6z"
    />
    <path {...stroke} stroke={filled ? 'var(--surface-card)' : 'currentColor'} d="m9 12 2.2 2.2L15.2 10" />
  </svg>
)

export const SupportIcon = ({ className, filled }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      {...stroke}
      fill={filled ? 'currentColor' : 'none'}
      d="M20.5 12a8.5 8.5 0 1 0-3.3 6.7l3.3.8-.9-3.2c.6-1.3.9-2.7.9-4.3Z"
    />
    <path {...stroke} stroke={filled ? 'var(--surface-card)' : 'currentColor'} d="M9.6 9.6a2.4 2.4 0 1 1 3.3 2.2c-.6.3-.9.8-.9 1.4v.3" />
    <circle cx="12" cy="16.4" r="0.9" fill={filled ? 'var(--surface-card)' : 'currentColor'} stroke="none" />
  </svg>
)

export const ProfileIcon = ({ className, filled }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle {...stroke} fill={filled ? 'currentColor' : 'none'} cx="12" cy="8.4" r="3.9" />
    <path {...stroke} fill={filled ? 'currentColor' : 'none'} d="M4.6 20.2c.6-3.6 3.7-5.7 7.4-5.7s6.8 2.1 7.4 5.7z" />
  </svg>
)

export const BrandMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} role="img" aria-label="بیمه ۲۴۷">
    <path
      d="M42.8 11.7A23 23 0 1 1 21.2 11.7"
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <path
      d="M32 18.9 43.5 23v8.6c0 6.5-4.9 11.3-11.5 13.6-6.6-2.3-11.5-7.1-11.5-13.6V23z"
      fill="currentColor"
    />
  </svg>
)

export const PlaneIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      {...stroke}
      d="M10.3 13.7 3.6 11.4a.6.6 0 0 1-.1-1.1l1.6-.9a1 1 0 0 1 .8-.1l2.9.8 3-3-4.6-2.4a.6.6 0 0 1-.1-1l1.3-.9a1 1 0 0 1 .8-.1l6.4 1.6 2.2-2.2a2 2 0 1 1 2.8 2.8L18.4 6.7l1.6 6.4a1 1 0 0 1-.1.8l-.9 1.3a.6.6 0 0 1-1-.1l-2.4-4.6-3 3 .8 2.9a1 1 0 0 1-.1.8l-.9 1.6a.6.6 0 0 1-1.1-.1z"
    />
  </svg>
)

export const CarIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path {...stroke} d="M4.2 13.4 5.9 8.3A2 2 0 0 1 7.8 7h8.4a2 2 0 0 1 1.9 1.3l1.7 5.1" />
    <path {...stroke} d="M3.5 13.4h17v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-.8h-9v.8a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1z" />
    <path {...stroke} d="M6.6 15.9h1.2M16.2 15.9h1.2" />
  </svg>
)

export const FireIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      {...stroke}
      d="M12 3.2c2.6 2.4 4 4.5 4 6.3 0 1.2-.6 2-1.6 2.4.5-1.9-.5-3.6-2.4-5-.4 2.6-1.6 3.5-2.9 4.9-1 1.1-1.6 2.2-1.6 3.5A5.4 5.4 0 0 0 12 20.8a5.4 5.4 0 0 0 5.6-5.5c0-4-2.6-7.4-5.6-12.1Z"
    />
  </svg>
)

export const ChevronIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path {...stroke} d="M14.5 6.5 9 12l5.5 5.5" />
  </svg>
)

export const CheckCircleIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle {...stroke} cx="12" cy="12" r="9" />
    <path {...stroke} d="m8 12.3 2.7 2.7L16 9.7" />
  </svg>
)

export const XCircleIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle {...stroke} cx="12" cy="12" r="9" />
    <path {...stroke} d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" />
  </svg>
)

export const ClockIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle {...stroke} cx="12" cy="12" r="9" />
    <path {...stroke} d="M12 7.2V12l3 1.8" />
  </svg>
)

export const AlertIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle {...stroke} cx="12" cy="12" r="9" />
    <path {...stroke} d="M12 7.6v5" />
    <path {...stroke} d="M12 16.2h.01" />
  </svg>
)

export const OfflineIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    {/* The usual wifi arcs, struck through — the one icon everyone reads as "no network". */}
    <path {...stroke} d="M4.5 9.2a13 13 0 0 1 15 0" />
    <path {...stroke} d="M7.6 12.6a8.5 8.5 0 0 1 8.8 0" />
    <path {...stroke} d="M10.7 16a4 4 0 0 1 2.6 0" />
    <path {...stroke} d="M19.5 4.5 4.5 19.5" />
  </svg>
)
