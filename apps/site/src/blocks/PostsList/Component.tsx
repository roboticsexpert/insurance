import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import type { Post, PostsListBlock as Props } from '@/payload-types'

export const PostsListBlock: React.FC<Props> = async ({
  heading,
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
    <section className="container py-12">
      {heading && <h2 className="text-2xl font-bold">{heading}</h2>}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((post) => (
          <li key={post.id} className="rounded border border-border p-4">
            <Link href={`/posts/${post.slug}`} className="font-bold">
              {post.title}
            </Link>
            {post.meta?.description && (
              <p className="mt-1 text-sm text-muted-foreground">{post.meta.description}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
