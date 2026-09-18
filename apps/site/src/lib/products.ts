/**
 * داده محصول برای سایت بازاریابی.
 *
 * تصمیم `docs/website/LANDING-PAGES.md`: عنوان، ویژگی‌ها و «از … تومان» از API می‌آیند
 * نه از CMS، تا دو منبع حقیقت نداشته باشیم. فعلاً **جای‌نگار** است تا دور طراحی به بالا
 * بودن API گره نخورد؛ نوع‌ها عیناً همان `apps/web/src/lib/catalog-api.ts`اند، پس وصل‌کردن
 * یعنی عوض‌کردن بدنه `getProducts` و بس.
 */

export type ProductType = 'TRAVEL' | 'MOTOR_TPL' | 'HOME_FIRE'

export interface ProductCard {
  id: string
  slug: string
  type: ProductType
  titleFa: string
  subtitleFa: string
  iconKey: string
  fulfillment: 'INSTANT' | 'MANUAL_QUOTE'
  /** ریال. وقتی هنوز چیزی قابل قیمت‌گذاری نیست null است و کارت «به‌زودی» می‌گوید. */
  fromAmount: number | null
  /** نرخ نمونه است، نه نرخ قطعی. برچسب «نرخ نمونه» به آن وابسته است. */
  fromAmountIsSample: boolean
}

/** آینه‌ای از `apps/api/prisma/seed-data/products.ts`. با اتصال به API حذف می‌شود. */
const STUB: ProductCard[] = [
  {
    id: 'stub-travel',
    slug: 'travel',
    type: 'TRAVEL',
    titleFa: 'بیمه مسافرتی',
    subtitleFa: 'برای سفرهای خارجی و اخذ ویزا',
    iconKey: 'plane',
    fulfillment: 'INSTANT',
    fromAmount: 4_500_000,
    fromAmountIsSample: true,
  },
  {
    id: 'stub-motor-tpl',
    slug: 'motor-tpl',
    type: 'MOTOR_TPL',
    titleFa: 'بیمه شخص ثالث',
    subtitleFa: 'الزامی برای همه خودروها و موتورسیکلت‌ها',
    iconKey: 'car',
    fulfillment: 'INSTANT',
    fromAmount: 78_000_000,
    fromAmountIsSample: true,
  },
  {
    id: 'stub-home-fire',
    slug: 'home-fire',
    type: 'HOME_FIRE',
    titleFa: 'بیمه آتش‌سوزی منزل',
    subtitleFa: 'ساختمان و اثاثیه، در برابر آتش و زلزله',
    iconKey: 'fire',
    fulfillment: 'INSTANT',
    fromAmount: 1_200_000,
    fromAmountIsSample: true,
  },
]

/**
 * وقتی نوبت اتصال شد، بدنه را با این عوض کنید و `STUB` را بردارید:
 *
 * ```ts
 * const res = await fetch(`${process.env.API_URL}/catalog/products`, {
 *   next: { revalidate: 300 },
 * })
 * if (!res.ok) return []
 * return res.json()
 * ```
 */
export const getProducts = async (): Promise<ProductCard[]> => STUB

export const getProduct = async (slug: string): Promise<ProductCard | undefined> =>
  (await getProducts()).find((p) => p.slug === slug)
