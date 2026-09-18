import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { seedContent } from '@/seed'

/**
 * موقت — بعد از یک‌بار اجرا روی محیط عملیاتی حذف می‌شود.
 *
 * دیتابیس Railway هیچ نقطه اتصال عمومی ندارد، پس داده اولیه را نمی‌شود از بیرون ریخت.
 * این مسیر همان `seedContent` را از داخل شبکه Railway صدا می‌زند. جایگزینش — باز کردن
 * موقت یک TCP proxy روی Postgres — کل دیتابیس پلتفرم را با سفارش‌ها و بیمه‌نامه‌های
 * واقعی مشتری‌ها در معرض اینترنت می‌گذاشت؛ این یکی فقط به محتوای CMS دست می‌زند.
 *
 * فقط با `Authorization: Bearer $CRON_SECRET`، و اگر آن راز تنظیم نشده باشد اصلاً باز
 * نمی‌شود. `seedContent` idempotent است، اما همچنان محتوا را بازنویسی می‌کند.
 */
export const dynamic = 'force-dynamic'

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return Response.json({ error: 'not available' }, { status: 404 })
  }

  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config: configPromise })
    await seedContent(payload)
    return Response.json({ seeded: true })
  } catch (error) {
    return Response.json(
      { seeded: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
