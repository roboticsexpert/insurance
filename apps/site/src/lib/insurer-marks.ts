import fs from 'node:fs'
import path from 'node:path'

/**
 * نشان برند هر شرکت در `public/insurers/<slug>.svg` است — فایل ایستا، نه آپلود
 * پیشخان، چون نشان‌ها با محتوا عوض نمی‌شوند و باید در مخزن نسخه‌بندی شوند.
 *
 * فهرست یک‌بار هنگام بالا آمدن سرور خوانده می‌شود: در محیط عملیاتی فایل‌ها داخل
 * ایمیج‌اند و عوض نمی‌شوند، ولی در توسعه اضافه‌کردن یک نشان تازه یک‌بار ری‌استارت
 * می‌خواهد. شرکتی که فایل ندارد فقط نامش می‌آید.
 */
export const bundledMarks: ReadonlySet<string> = (() => {
  try {
    return new Set(
      fs
        .readdirSync(path.join(process.cwd(), 'public', 'insurers'))
        .filter((file) => file.endsWith('.svg'))
        .map((file) => file.slice(0, -'.svg'.length)),
    )
  } catch {
    return new Set<string>()
  }
})()
