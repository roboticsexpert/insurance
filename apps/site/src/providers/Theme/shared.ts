import type { Theme } from './types'

export const themeLocalStorageKey = 'bimegold-theme'

export const defaultTheme = 'light'

export const getImplicitPreference = (): Theme | null => {
  const mediaQuery = '(prefers-color-scheme: dark)'
  const mql = window.matchMedia(mediaQuery)
  const hasImplicitPreference = typeof mql.matches === 'boolean'

  if (hasImplicitPreference) {
    return mql.matches ? 'dark' : 'light'
  }

  return null
}

/**
 * انتخاب تم در `localStorage` است، یعنی یک store بیرون از React. با
 * `useSyncExternalStore` خوانده می‌شود نه با یک effect که setState می‌کند: هم قاعده
 * `react-hooks/set-state-in-effect` راضی است، هم React خودش ناسازگاری هیدریشن را حل می‌کند
 * (سرور «خودکار» می‌دهد و کلاینت بعد از هیدریشن مقدار واقعی را).
 *
 * رویداد `storage` فقط بین تب‌ها شلیک می‌شود، پس تغییر در همین تب را خودمان اعلام می‌کنیم.
 */
export type ThemePreference = Theme | 'auto'

const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())

export const subscribeToThemePreference = (listener: () => void): (() => void) => {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

export const getThemePreference = (): ThemePreference =>
  (window.localStorage.getItem(themeLocalStorageKey) as ThemePreference | null) ?? 'auto'

/** روی سرور همیشه «خودکار» — هیچ‌چیز از انتخاب کاربر آنجا معلوم نیست. */
export const getServerThemePreference = (): ThemePreference => 'auto'

export const writeThemePreference = (preference: ThemePreference): void => {
  if (preference === 'auto') {
    window.localStorage.removeItem(themeLocalStorageKey)
  } else {
    window.localStorage.setItem(themeLocalStorageKey, preference)
  }
  emit()
}
