import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import type { Category, Post, PostsListBlock as Props } from '@/payload-types'

import { ArrowIcon } from '@/components/icons'
import { Media } from '@/components/Media'
import { formatJalali } from '@/lib/fa'

const firstCategory = (post: Post): string | null => {
  const category = (post.categories ?? []).find((c): c is Category => typeof c === 'object')
  return category?.title ?? null
}

/**
 * «پیش از خرید بخوانید»، از روی بوم خانه.
 *
 * طرح کنار تاریخ یک «[زمان مطالعه]» هم دارد. مقاله‌ها چنین فیلدی ندارند و حدس‌زدنش
 * یعنی نوشتن عددی که پشتش چیزی نیست، پس فقط تاریخ می‌آید. اگر لازم شد، از روی
 * `content` حساب می‌شود و به `posts` اضافه — نه اینجا.
 */
export const PostsListBlock: React.FC<Props> = async ({
  heading,
  subheading,
  mode,
  categories,
  limit,
  posts,
}) => {
  let list: Post[] = []

  if (mode === 'manual') {
    list = (posts ?? []).filter((p): p is Post => typeof p === 'object')
  } else {
    const categoryIDs = (categories ?? []).map((c) => (typeof c === 'object' ? c.id : c))
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'posts',
      limit: limit ?? 3,
      sort: '-publishedAt',
      depth: 1,
      ...(categoryIDs.length ? { where: { categories: { in: categoryIDs } } } : {}),
    })
    list = res.docs
  }

  if (!list.length) return null

  return (
    /* پدینگ پایین ندارد — فاصله تا نوار دعوت را خود آن نوار می‌دهد. */
    <section aria-labelledby="posts-title" className="shell pt-10 pb-0 lg:pt-26 lg:pb-0">
      <div className="flex items-center justify-between gap-4 lg:items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.375rem] font-bold lg:text-4xl lg:leading-[1.5]" id="posts-title">
            {heading}
          </h2>
          {subheading && (
            <p className="hidden text-muted-foreground lg:block lg:text-[1.0625rem]">
              {subheading}
            </p>
          )}
        </div>
        <Link
          className="flex h-11 shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 lg:text-[0.9375rem]"
          href="/posts"
        >
          <span className="lg:hidden">همه</span>
          <span className="hidden lg:inline">همه مقاله‌ها</span>
          <ArrowIcon size={16} />
        </Link>
      </div>

      <ul className="mt-3 grid gap-3 lg:mt-8 lg:grid-cols-3 lg:gap-5">
        {list.map((post) => {
          const category = firstCategory(post)
          const image = post.meta?.image ?? post.heroImage

          return (
            <li className="flex" key={post.id}>
              <Link
                className="flex w-full items-center gap-3 overflow-hidden rounded-card border border-border bg-card p-3 text-foreground shadow-card transition-shadow hover:shadow-md lg:flex-col lg:items-stretch lg:gap-0 lg:p-0"
                href={`/posts/${post.slug}`}
              >
                <span className="flex size-22 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sunken text-[0.625rem] text-muted-foreground lg:h-52 lg:w-full lg:rounded-none lg:text-[0.8125rem]">
                  {image && typeof image === 'object' ? (
                    <Media imgClassName="size-full object-cover" resource={image} />
                  ) : (
                    '[تصویر مقاله]'
                  )}
                </span>

                <span className="flex flex-col gap-1.5 lg:gap-2.5 lg:px-6 lg:pt-5 lg:pb-6">
                  {category && (
                    <span className="hidden w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground lg:block">
                      {category}
                    </span>
                  )}
                  <span className="text-[0.9375rem] leading-[1.7] font-semibold lg:text-[1.1875rem] lg:font-bold">
                    {post.title}
                  </span>
                  {post.publishedAt && (
                    <span className="text-xs text-muted-foreground lg:text-[0.8125rem]">
                      {formatJalali(post.publishedAt)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
