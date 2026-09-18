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

/**
 * یادداشت‌های داخلی کاری — پوشه `docs/` ریشه مخزن.
 *
 * این‌ها برخلاف موضوع‌های پژوهشی، فرانت‌متر ندارند و انگلیسی و چپ‌به‌راست‌اند؛ همان فایل‌هایی
 * هستند که روی گیت‌هاب خوانده می‌شوند و اینجا فقط رندر می‌شوند تا در یک جا قابل مرور باشند.
 * پس schema همه‌چیز را اختیاری می‌گیرد و عنوان از اولین تیتر `#` بیرون کشیده می‌شود.
 *
 * `generateId` صریح است تا نشانی هر صفحه دقیقاً «مسیر فایل با حروف کوچک» باشد؛ افزونه
 * `rehype-internal-links` روی همین قرارداد لینک‌های `.md` داخل متن را بازنویسی می‌کند.
 */
const internal = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: '../../docs',
    generateId: ({ entry }) => entry.replace(/\.md$/, '').toLowerCase(),
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { topics, internal };
