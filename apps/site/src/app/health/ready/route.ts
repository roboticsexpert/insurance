import { getPayload } from 'payload'

import { NextResponse } from 'next/server'

import configPromise from '@payload-config'

/*
 * آمادگی: می‌گوید کانتینر واقعاً می‌تواند ترافیک بگیرد، و همین مسیر است که به
 * `healthcheckPath` سرویس `site` روی Railway وصل شده.
 *
 * دو کار در یک درخواست:
 *
 * ۱. `getPayload` را صدا می‌زند، که همان init کامل است — اتصال به Postgres و اجرای
 *    `prodMigrations`. Payload به‌صورت تنبل بالا می‌آید، یعنی بدون این‌جا اولین
 *    *بازدیدکننده* بعد از هر استقرار هزینه‌اش را می‌داد (روی این سرویس چند ثانیه
 *    اندازه‌گیری شده). حالا health check آن را می‌دهد، پیش از آن‌که Railway کانتینر
 *    قبلی را بردارد.
 * ۲. یک شمارش واقعی روی `pages` می‌زند تا معلوم شود اسکیمای `cms` هم هست — نه صرفاً
 *    این‌که اتصال باز شد.
 *
 * وقتی آماده نیست باید ۵۰۳ برگردد، نه ۲۰۰ با بدنه‌ای که می‌گوید خراب است: Railway
 * فقط به کد وضعیت نگاه می‌کند و هر ۲xx یعنی «این استقرار را زنده کن».
 */
export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  try {
    const payload = await getPayload({ config: configPromise })
    await payload.count({ collection: 'pages' })

    return NextResponse.json({ status: 'ok', database: 'up' })
  } catch (error) {
    console.error('readiness probe failed', error)

    return NextResponse.json({ status: 'degraded', database: 'down' }, { status: 503 })
  }
}
