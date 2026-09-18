import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatJalali } from '@/lib/fa'

/**
 * سربرگ مقاله. جای `heros/PostHero` قالب را گرفته — تاریخ جلالی است و نویسنده از
 * مجموعه `authors` می‌آید نه از `users`.
 */
export const PostHeader: React.FC<{ post: Post }> = ({ post }) => {
  const { categories, heroImage, publishedAt, title, authors } = post

  const categoryTitles = (categories ?? []).filter((c) => typeof c === 'object').map((c) => c.title)

  const authorNames = (authors ?? []).filter((a) => typeof a === 'object').map((a) => a.name)

  return (
    <header className="container py-8">
      {categoryTitles.length > 0 && (
        <p className="mb-2 text-sm text-muted-foreground">{categoryTitles.join('، ')}</p>
      )}

      <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {authorNames.length > 0 && <span>نوشته {authorNames.join('، ')}</span>}
        {publishedAt && <time dateTime={publishedAt}>{formatJalali(publishedAt)}</time>}
      </div>

      {heroImage && typeof heroImage === 'object' && (
        <div className="mt-6">
          <Media priority resource={heroImage} imgClassName="rounded-lg" />
        </div>
      )}
    </header>
  )
}
