import PageTemplate, { generateMetadata } from './[slug]/page'

/*
 * باید همین‌جا و به‌صورت لفظی نوشته شود؛ Next این تنظیم را هنگام کامپایل به‌صورت
 * ایستا می‌خواند و یک `export ... from` را قبول نمی‌کند. دلیلش را در `[slug]/page.tsx`
 * ببینید — صفحه خانه هم همان صفحه است.
 */
export const dynamic = 'force-dynamic'

export default PageTemplate

export { generateMetadata }
