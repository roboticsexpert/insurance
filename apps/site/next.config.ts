import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const NEXT_PUBLIC_SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3100'

const nextConfig: NextConfig = {
  // ایمیج داکر فقط سرور و همان وابستگی‌هایی را می‌خواهد که واقعاً import شده‌اند.
  // `outputFileTracingRoot` ریشه ورک‌اسپیس است چون node_modules مربوط به pnpm
  // آنجاست و ردیابی باید از همان‌جا شروع شود.
  output: 'standalone',
  outputFileTracingRoot: path.resolve(dirname, '../..'),
  // تا وقتی Next مسئله resolve مربوط به Sass در Turbopack روی ویندوز را حل کند.
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  // ریشه ورک‌اسپیس است نه پوشه همین اپ: با node_modules ایزوله pnpm، پکیج `next`
  // یک symlink به `.pnpm` در ریشه مخزن است و Turbopack بیرون از root خودش را resolve نمی‌کند.
  turbopack: {
    root: path.resolve(dirname, '../..'),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
