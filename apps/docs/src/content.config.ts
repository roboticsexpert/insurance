import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const topics = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/topics' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    // شماره ترتیب برای چیدمان در صفحه اصلی
    order: z.number().default(99),
    updated: z.string(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['draft', 'in-progress', 'reviewed']).default('in-progress'),
  }),
});

export const collections = { topics };
