// فقط سمت سرور صدا زده می‌شود؛ `API_URL` متغیر سرور است و به باندل مرورگر نمی‌رود.

/**
 * فهرست‌های انتخابی ویزارد، از API.
 *
 * تصمیم `docs/website/LANDING-PAGES.md`: فرم استعلام سایت نباید گزینه‌ای بسازد که
 * ویزارد نمی‌شناسد. مقدار هر گزینه (`SCHENGEN`، `APARTMENT`، شناسه شهر…) باید عیناً
 * همان چیزی باشد که `createQuote` می‌فرستد، پس تنها منبع درستش خود API است — نه CMS
 * و نه فهرستی دست‌نویس در همین مخزن.
 *
 * `GET /catalog/reference/:key` عمومی است و احراز هویت نمی‌خواهد.
 */
export interface ReferenceItem {
  value: string
  labelFa: string
  /** گزینه‌ها را زیر یک سرگروه می‌برد — استان برای شهرها، برند برای خودروها. */
  groupFa?: string
  meta?: Record<string, string | number>
}

export type ReferenceKey =
  | 'cities'
  | 'extra-perils'
  | 'property-types'
  | 'travel-coverages'
  | 'travel-zones'
  | 'vehicle-models'
  | 'vehicle-usages'

const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1'

/**
 * خالی برمی‌گرداند اگر API بالا نباشد یا جواب ندهد، و فرم همان فیلد را نمی‌سازد —
 * یعنی برمی‌گردد به همان رفتار قبلی که ویزارد خودش می‌پرسید.
 *
 * این عمدی است: صفحه بازاریابی نباید به بالا بودن API گره بخورد. یک لندینگ که چون
 * `apps/api` ری‌استارت شده پانصد می‌دهد، بدتر از لندینگی است که یک فیلد کمتر دارد.
 */
export const getReference = async (key: ReferenceKey): Promise<ReferenceItem[]> => {
  try {
    const res = await fetch(`${API_URL}/catalog/reference/${key}`, {
      // فهرست‌ها تقریباً ثابت‌اند؛ ساعتی یک‌بار تازه‌شان می‌کنیم.
      next: { revalidate: 3600, tags: ['reference'] },
      /*
       * API کندِ بالا بدتر از API خاموش است: خاموش فوراً رد می‌شود، ولی کند کل
       * رندر صفحه خانه را نگه می‌دارد. سه ثانیه سقفش است و بعدش فرم بدون آن فیلد
       * ساخته می‌شود.
       */
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return []
    const data: unknown = await res.json()
    return Array.isArray(data) ? (data as ReferenceItem[]) : []
  } catch {
    return []
  }
}

export type ReferenceOptions = Partial<Record<ReferenceKey, ReferenceItem[]>>

/** چند فهرست را با هم می‌گیرد و هرکدام که نیامد را خالی می‌گذارد. */
export const getReferences = async (keys: ReferenceKey[]): Promise<ReferenceOptions> => {
  const lists = await Promise.all(keys.map((key) => getReference(key)))
  return Object.fromEntries(keys.map((key, i) => [key, lists[i]]))
}
