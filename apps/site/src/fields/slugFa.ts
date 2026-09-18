import { slugField } from 'payload'

import { slugifyFa } from '@/utilities/slugifyFa'

type SlugFieldArgs = Parameters<typeof slugField>[0]

/**
 * همان `slugField` خود Payload، فقط با اسلاگ‌ساز فارسی.
 * همه‌جای این پروژه به‌جای `slugField` از این استفاده کنید.
 */
export const slugFieldFa = (args: SlugFieldArgs = {}) =>
  slugField({
    ...args,
    slugify: ({ valueToSlugify }) => slugifyFa(valueToSlugify),
  })
