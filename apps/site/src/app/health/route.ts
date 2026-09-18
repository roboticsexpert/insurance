import { NextResponse } from 'next/server'

/*
 * زنده‌بودن: فقط می‌گوید پروسه بالاست. عمداً به دیتابیس دست نمی‌زند — همان قرارداد
 * `GET /health` در `apps/api`. برای health check مربوط به Railway این کافی نیست:
 * سرور standalone مربوط به Next بی‌درنگ روی پورت می‌نشیند در حالی که Payload هنوز
 * راه نیفتاده. آن کار با `/health/ready` است.
 */
export const dynamic = 'force-dynamic'

export function GET(): NextResponse {
  return NextResponse.json({ status: 'ok', uptime: Math.round(process.uptime()) })
}
