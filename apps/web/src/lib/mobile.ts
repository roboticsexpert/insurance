/**
 * Client-side mobile validation, kept intentionally thin: enough for instant feedback, while
 * the API stays the authority and returns the message that actually gets shown for anything
 * subtler. Duplicating the server's full rules here is how the two drift apart.
 */
export const isPlausibleMobile = (value: string): boolean => /^09\d{9}$/.test(value)

export const mobileHint = (value: string): string | undefined => {
  if (value.length === 0) return undefined
  if (!value.startsWith('0')) return 'شماره باید با ۰ شروع شود'
  if (value.length > 1 && !value.startsWith('09')) return 'شماره موبایل با ۰۹ شروع می‌شود'
  if (value.length < 11) return undefined
  return isPlausibleMobile(value) ? undefined : 'شماره موبایل معتبر نیست'
}
