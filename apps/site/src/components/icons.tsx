import React from 'react'

/**
 * آیکن‌های سایت.
 *
 * مسیرها عیناً از بوم طرح (`docs/website/LANDING-PAGES.md`) برداشته شده‌اند: خطی،
 * ضخامت ۱٫۷، سر و گوشه گرد، بدون پرکردن. رنگ از `currentColor` می‌آید، پس آیکن
 * رنگ متن پدر را می‌گیرد و جای دیگری تنظیم نمی‌شود.
 *
 * عمداً اینجا هستند نه در `lucide-react`: طرح چند آیکن دست‌کشیده دارد (خودرو،
 * آتش) که معادل دقیق ندارند، و قاطی‌کردن دو خانواده آیکن در یک صفحه دیده می‌شود.
 */

export type IconProps = {
  className?: string
  /** اندازه بر حسب پیکسل. طرح ۱۶ (داخل فهرست)، ۲۲، ۲۶ و ۲۸ را به کار می‌برد. */
  size?: number
}

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({
  children,
  className,
  size = 24,
}) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.7}
    viewBox="0 0 24 24"
    width={size}
  >
    {children}
  </svg>
)

export const CarIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M4.2 13.4 5.9 8.3A2 2 0 0 1 7.8 7h8.4a2 2 0 0 1 1.9 1.3l1.7 5.1" />
    <path d="M3.5 13.4h17v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-.8h-9v.8a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1z" />
    <path d="M6.6 15.9h1.2M16.2 15.9h1.2" />
  </Svg>
)

export const PlaneIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M10.3 13.7 3.6 11.4a.6.6 0 0 1-.1-1.1l1.6-.9a1 1 0 0 1 .8-.1l2.9.8 3-3-4.6-2.4a.6.6 0 0 1-.1-1l1.3-.9a1 1 0 0 1 .8-.1l6.4 1.6 2.2-2.2a2 2 0 1 1 2.8 2.8L18.4 6.7l1.6 6.4a1 1 0 0 1-.1.8l-.9 1.3a.6.6 0 0 1-1-.1l-2.4-4.6-3 3 .8 2.9a1 1 0 0 1-.1.8l-.9 1.6a.6.6 0 0 1-1.1-.1z" />
  </Svg>
)

export const FireIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M12 3.2c2.6 2.4 4 4.5 4 6.3 0 1.2-.6 2-1.6 2.4.5-1.9-.5-3.6-2.4-5-.4 2.6-1.6 3.5-2.9 4.9-1 1.1-1.6 2.2-1.6 3.5A5.4 5.4 0 0 0 12 20.8a5.4 5.4 0 0 0 5.6-5.5c0-4-2.6-7.4-5.6-12.1Z" />
  </Svg>
)

export const BriefcaseIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <rect height="12" rx="2" width="17" x="3.5" y="7.5" />
    <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17" />
  </Svg>
)

export const ClockIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)

export const TagIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.4 1.4 0 0 1 0 2l-6.8 6.8a1.4 1.4 0 0 1-2 0z" />
    <circle cx="8" cy="8" r="1.3" />
  </Svg>
)

export const LockIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <rect height="10" rx="2" width="14" x="5" y="10.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
)

export const CheckCircleIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
  </Svg>
)

/** سپر با تیک — سرِ ستون «پوشش می‌دهد». */
export const ShieldCheckIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M12 3.2 19.5 6v6.1c0 4.3-3.2 7.6-7.5 9-4.3-1.4-7.5-4.7-7.5-9V6z" />
    <path d="m9 12 2.2 2.2L15.2 10" />
  </Svg>
)

/** دایره خط‌خورده — سرِ ستون «پوشش نمی‌دهد». */
export const SlashCircleIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Svg>
)

export const CheckIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="m5 12.5 4.2 4.2L19 7" />
  </Svg>
)

/** فلش «ادامه». راست‌به‌راست است، پس به چپ اشاره می‌کند. */
export const ArrowIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
  </Svg>
)

export const PlusIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const MinusIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M5 12h14" />
  </Svg>
)

export const MenuIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
)

export const CloseIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)

/**
 * آیکن هر محصول با `iconKey` انتخاب می‌شود — همان کلیدی که `src/lib/products.ts`
 * از API می‌گیرد، تا محصول تازه بدون تغییر کد آیکن درست بگیرد.
 */
export const PRODUCT_ICONS: Record<string, React.FC<IconProps>> = {
  car: CarIcon,
  plane: PlaneIcon,
  fire: FireIcon,
  briefcase: BriefcaseIcon,
}

/** آیکن‌هایی که بلوک «ویژگی‌ها» از پیشخان انتخابشان می‌کند. */
export const FEATURE_ICONS: Record<string, React.FC<IconProps>> = {
  clock: ClockIcon,
  tag: TagIcon,
  lock: LockIcon,
  check: CheckCircleIcon,
  car: CarIcon,
  plane: PlaneIcon,
  fire: FireIcon,
  briefcase: BriefcaseIcon,
}
