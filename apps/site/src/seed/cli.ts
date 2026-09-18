/**
 * اجرای داده اولیه از خط فرمان — `pnpm --filter @bimegold/site seed`.
 * منطقش در `./index.ts` است تا مسیر `POST /next/seed` هم بتواند همان را صدا بزند.
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
