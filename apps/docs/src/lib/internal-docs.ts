import { getCollection, type CollectionEntry } from 'astro:content';

export type InternalDoc = CollectionEntry<'internal'>;

/** برچسب فارسی هر پوشه؛ کلید خالی یعنی خودِ `docs/`. */
const GROUPS: { dir: string; label: string; note: string }[] = [
  { dir: '', label: 'کلیات', note: 'نمای کلی پروژه و برنامه کسب‌وکار' },
  { dir: 'platform', label: 'پلتفرم', note: 'طراحی، پیشرفت و استقرار سامانه خرید آنلاین' },
  { dir: 'meetings', label: 'جلسه‌ها', note: 'یادداشت خام هر جلسه با شرکت‌های بیمه' },
];

/**
 * این فایل‌ها فرانت‌متر ندارند — همان یادداشت‌های کاری مخزن‌اند — پس عنوان از اولین تیتر
 * `#` و خلاصه از اولین پاراگراف بعد از آن بیرون کشیده می‌شود.
 */
export function docTitle(doc: InternalDoc): string {
  if (doc.data.title) return doc.data.title;
  const heading = doc.body?.match(/^#\s+(.+)$/m)?.[1];
  return heading ? stripInline(heading) : doc.id;
}

export function docSummary(doc: InternalDoc): string {
  if (doc.data.description) return doc.data.description;
  const body = doc.body ?? '';
  const afterTitle = body.slice(body.indexOf('\n', body.indexOf('# ')) + 1);
  const paragraph = afterTitle
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block.length > 0 && !/^[#>\-*|`!]/.test(block));
  if (!paragraph) return '';
  const text = stripInline(paragraph.replace(/\s+/g, ' '));
  return text.length > 180 ? `${text.slice(0, 180).trimEnd()}…` : text;
}

/** مسیر فایل در مخزن — چیزی که روی دیسک و روی گیت‌هاب باید دنبالش گشت. */
export function docPath(doc: InternalDoc): string {
  return `docs/${doc.filePath?.split('/docs/').pop() ?? `${doc.id}.md`}`;
}

function stripInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .trim();
}

export async function internalDocGroups() {
  const docs = await getCollection('internal');

  return GROUPS.map((group) => ({
    ...group,
    docs: docs
      .filter((doc) => {
        const dir = doc.id.includes('/') ? doc.id.slice(0, doc.id.lastIndexOf('/')) : '';
        return dir === group.dir;
      })
      .sort((a, b) => a.id.localeCompare(b.id)),
  })).filter((group) => group.docs.length > 0);
}
