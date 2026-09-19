import React from 'react'

import type { QuoteFormBlock as Props } from '@/payload-types'

import { getReferences, type ReferenceKey } from '@/lib/reference'

import { QuoteForm } from './Form'

/**
 * فهرست‌هایی که فرم هر محصول لازم دارد.
 *
 * مقدار هر گزینه باید عیناً همان چیزی باشد که ویزارد می‌فرستد، پس از `reference`های
 * خود API می‌آیند نه از CMS و نه از فهرستی دست‌نویس اینجا. چیزی که فهرست ندارد —
 * سال ساخت، متراژ، مبلغ‌ها، تاریخ‌ها — در خود فرم است.
 *
 * محصول «انتخاب کاربر» هر سه دسته را می‌خواهد، چون کاربر بدون بارگذاری دوباره صفحه
 * بینشان جابه‌جا می‌شود.
 */
const KEYS: Record<string, ReferenceKey[]> = {
  'home-fire': ['property-types', 'cities', 'extra-perils'],
  'motor-tpl': [],
  travel: ['travel-zones', 'travel-coverages'],
}

const ALL_KEYS: ReferenceKey[] = [...KEYS.travel!, ...KEYS['home-fire']!]

/**
 * پوسته سمت سرور فرم استعلام: فهرست‌ها را می‌گیرد و به فرم می‌دهد.
 *
 * جدا بودنش از `Form.tsx` برای همین است — فرم باید کلاینت باشد (وضعیت محصول
 * انتخابی، مبلغ، مسافرها)، ولی `API_URL` و کش `fetch` سمت سرورند و نباید به باندل
 * مرورگر بروند. اگر API جواب ندهد فهرست‌ها خالی می‌آیند و فرم همان فیلد را نمی‌سازد؛
 * لندینگ به بالا بودن API گره نمی‌خورد.
 */
export const QuoteFormBlock: React.FC<Props & { asColumn?: boolean }> = async (props) => {
  const options = await getReferences(KEYS[props.product ?? 'any'] ?? ALL_KEYS)

  return <QuoteForm {...props} options={options} />
}
