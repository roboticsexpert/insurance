/**
 * XML نقشه سایت را خودمان می‌نویسیم تا `next-sitemap` یک وابستگی کمتر باشد —
 * چیزی که لازم داشتیم فقط همین بیست خط بود.
 */
export type SitemapEntry = { loc: string; lastmod?: string }

const escapeXml = (value: string): string =>
  value.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      default:
        return '&quot;'
    }
  })

export const sitemapResponse = (entries: SitemapEntry[]): Response => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    ({ loc, lastmod }) =>
      `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`,
  )
  .join('\n')}
</urlset>`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
