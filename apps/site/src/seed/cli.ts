/**
 * اجرای داده اولیه از خط فرمان — `pnpm --filter @bimegold/site seed`.
 * منطقش جدا در `./index.ts` است تا اگر روزی لازم شد از جای دیگری هم صدا زده شود.
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'
import { seedContent } from './index'

const run = async () => {
  const payload = await getPayload({ config })
  await seedContent(payload)
  process.exit(0)
}

void run()
