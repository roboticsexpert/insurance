import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

/** تصویر OG فقط وقتی هست که خود سند یکی داشته باشد — تصویر پیش‌فرض برند با دور طراحی می‌آید. */
const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  if (!image || typeof image !== 'object' || !('url' in image)) return undefined

  const serverUrl = getServerSideURL()
  const ogUrl = image.sizes?.og?.url

  return ogUrl ? serverUrl + ogUrl : serverUrl + image.url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.meta?.image)

  // عنوان صفحه از فیلد سئو می‌آید؛ اگر خالی بود، عنوان خود صفحه، وگرنه نام برند.
  const fallback = 'title' in (doc ?? {}) ? (doc as Partial<Page>).title : undefined
  const base = doc?.meta?.title || fallback
  const title = base ? `${base} | بیمه گلد` : 'بیمه گلد'

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
