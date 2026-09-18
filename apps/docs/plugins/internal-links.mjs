import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * افزونه‌های Sätteri (پردازنده پیش‌فرض مارک‌داون در Astro 7) — نه remark/rehype.
 * هر افزونه یک شیء با `name` و یک بازدیدکننده به‌ازای نوع نود است.
 */

/**
 * لینک‌های داخل یادداشت‌های داخلی به فایل نوشته شده‌اند (`platform/MVP-PLAN.md`) چون روی
 * گیت‌هاب هم باید کار کنند. در خروجی سایت این‌ها ۴۰۴ می‌دهند، پس اینجا به نشانی صفحه ترجمه
 * می‌شوند:
 *
 *   docs/platform/MVP-PLAN.md                → /internal/platform/mvp-plan/
 *   apps/docs/src/content/topics/<slug>.md   → /topics/<slug>/
 *
 * قرارداد نشانی همان `generateId` مجموعه `internal` است: مسیر نسبی بدون پسوند، حروف کوچک.
 * موضوع‌های فارسی سایت لینک `.md` ندارند (همه با نشانی مطلق نوشته شده‌اند)، پس این افزونه
 * عملاً فقط روی یادداشت‌های داخلی اثر می‌گذارد.
 */
export function internalLinks({ docsDir, topicsDir }) {
  return {
    name: 'internal-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href !== 'string' || !href.endsWith('.md')) return;
        // نشانی‌های مطلق و بیرونی دست‌نخورده می‌مانند
        if (/^[a-z]+:/i.test(href) || href.startsWith('/')) return;
        if (!ctx.fileURL) return;

        const target = path.resolve(path.dirname(fileURLToPath(ctx.fileURL)), href);

        const inTopics = path.relative(topicsDir, target);
        if (!inTopics.startsWith('..')) {
          ctx.setProperty(node, 'href', `/topics/${inTopics.replace(/\.md$/, '')}/`);
          return;
        }

        const inDocs = path.relative(docsDir, target);
        if (!inDocs.startsWith('..')) {
          const slug = inDocs.replace(/\.md$/, '').toLowerCase();
          ctx.setProperty(node, 'href', `/internal/${slug}/`);
        }
      },
    },
  };
}

/**
 * جدول‌های مارک‌داون در `div.table-scroll` پیچیده می‌شوند تا در موبایل خودشان اسکرول کنند
 * و کل صفحه را پهن نکنند — همان کاری که موضوع‌های فارسی دستی در HTML خام انجام داده‌اند.
 */
export function scrollableTables() {
  return {
    name: 'scrollable-tables',
    element: {
      filter: ['table'],
      visit(node, ctx) {
        const parent = ctx.parent(node);
        const wrapped =
          parent?.type === 'element' &&
          parent.tagName === 'div' &&
          [].concat(parent.properties?.className ?? []).includes('table-scroll');
        if (wrapped) return;

        ctx.wrapNode(node, {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'] },
          children: [],
        });
      },
    },
  };
}
