import { NavLink } from 'react-router'
import { HomeIcon, PolicyIcon, ProfileIcon, SupportIcon } from './icons'

const TABS = [
  { to: '/', label: 'خانه', Icon: HomeIcon, end: true },
  { to: '/policies', label: 'بیمه‌نامه‌های من', Icon: PolicyIcon, end: false },
  { to: '/support', label: 'پشتیبانی', Icon: SupportIcon, end: false },
  { to: '/profile', label: 'پروفایل', Icon: ProfileIcon, end: false },
] as const

export function BottomTabBar() {
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[430px] border-t border-line bg-card/95 pt-1.5 backdrop-blur"
      aria-label="ناوبری اصلی"
    >
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="flex flex-1 flex-col items-center gap-1 px-1 py-1 text-[0.68rem] transition-colors"
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`h-6 w-6 ${isActive ? 'text-brand-600' : 'text-muted'}`}
                filled={isActive}
              />
              <span className={isActive ? 'font-semibold text-brand-600' : 'text-muted'}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
