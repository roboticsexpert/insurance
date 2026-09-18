/**
 * اسلاگ‌ساز فارسی.
 *
 * `slugify` پیش‌فرض Payload الگوی `[^\w-]+` را حذف می‌کند، یعنی یک عنوان فارسی به اسلاگ
 * خالی تبدیل می‌شود. اینجا حروف فارسی را نگه می‌داریم و آدرس‌ها فارسی می‌مانند
 * (`/محصولات/شخص-ثالث`) — مرورگر آن را percent-encode می‌کند و موتور جست‌وجو مشکلی ندارد.
 *
 * پیش از اسلاگ‌سازی متن نرمال می‌شود تا `ي`/`ك` عربی و `ی`/`ک` فارسی به دو آدرس متفاوت
 * ختم نشوند، و ارقام فارسی به لاتین تبدیل شوند.
 */

const ARABIC_YEH = /ي/g // ي → ی
const ARABIC_KAF = /ك/g // ك → ک
const ARABIC_ALEF_MAKSURA = /ى/g // ى → ی
const TATWEEL = /ـ/g // ـ کشیدگی، معنایی ندارد
const DIACRITICS = /[ً-ْٰ]/g // اعراب
const ZWNJ = /‌/g // نیم‌فاصله → خط تیره

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** حروف و ارقام فارسی/عربی که باید در اسلاگ بمانند. */
const KEEP = /[^ء-غف-يٮ-ۓ\w-]+/g

export const normalizeFa = (input: string): string => {
  let out = input
    .replace(ARABIC_YEH, 'ی')
    .replace(ARABIC_ALEF_MAKSURA, 'ی')
    .replace(ARABIC_KAF, 'ک')
    .replace(TATWEEL, '')
    .replace(DIACRITICS, '')

  for (let i = 0; i < 10; i++) {
    out = out.replace(new RegExp(PERSIAN_DIGITS[i]!, 'g'), String(i))
    out = out.replace(new RegExp(ARABIC_DIGITS[i]!, 'g'), String(i))
  }

  return out
}

export const slugifyFa = (val?: string): string | undefined => {
  if (!val) return undefined

  return (
    normalizeFa(val)
      .trim()
      .replace(ZWNJ, '-')
      .replace(/\s+/g, '-')
      .replace(KEEP, '')
      // خط تیره‌های پشت‌سرهم و ابتدا/انتها را جمع می‌کنیم
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || undefined
  )
}
