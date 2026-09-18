import type { Metadata } from 'next'

// تصویر OG پیش‌فرض عمداً اینجا نیست — با دور طراحی اضافه می‌شود، نه با یک جای‌نگار.
const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  locale: 'fa_IR',
  description: 'خرید آنلاین بیمه‌نامه، با نرخ شفاف و صدور آنی.',
  siteName: 'بیمه گلد',
  title: 'بیمه گلد',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
