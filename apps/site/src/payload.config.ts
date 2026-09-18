import { postgresAdapter } from '@payloadcms/db-postgres'
import { fa } from '@payloadcms/translations/languages/fa'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Faqs } from './collections/Faqs'
import { Insurers } from './collections/Insurers'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { migrations } from './migrations'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      graphics: {
        Logo: '@/components/AdminGraphics/Logo#AdminLogo',
        Icon: '@/components/AdminGraphics/Icon#AdminIcon',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    meta: {
      titleSuffix: ' — بیمه گلد',
    },
    livePreview: {
      breakpoints: [
        { label: 'موبایل', name: 'mobile', width: 390, height: 844 },
        { label: 'تبلت', name: 'tablet', width: 768, height: 1024 },
        { label: 'دسکتاپ', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  // فارسی زبان پیشخان است؛ Payload خودش پنل را راست‌به‌چپ می‌کند.
  i18n: {
    supportedLanguages: { fa },
    fallbackLanguage: 'fa',
  },
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    // جدول‌های CMS در اسکیمای خودشان‌اند، نه در `public` که Prisma مربوط به `apps/api`
    // آن را اداره می‌کند. یعنی همان دیتابیس، بدون اینکه دو مهاجرت‌ساز به هم بخورند —
    // و روی Railway که Postgres هیچ نقطه اتصال عمومی ندارد، لازم نیست برای ساختن یک
    // دیتابیس تازه، آن را در معرض اینترنت بگذاریم.
    schemaName: 'cms',
    // در محیط عملیاتی اسکیما فقط با مهاجرت عوض می‌شود، نه با push خودکار.
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
    // مهاجرت‌ها به‌صورت import استاتیک می‌آیند، نه از راه CLI: هم Next آن‌ها را داخل
    // خروجی standalone ردیابی می‌کند، هم هنگام بالا آمدن در محیط عملیاتی خودشان اجرا
    // می‌شوند بدون اینکه ایمیج مجبور باشد کل node_modules و payload CLI را حمل کند.
    prodMigrations: migrations,
  }),
  collections: [Pages, Posts, Categories, Authors, Faqs, Insurers, Media, Users],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
