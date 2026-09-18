'use client'
import Link from 'next/link'
import React from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

/**
 * قالب اصلی Payload اینجا یک `HeaderThemeProvider` داشت تا هر صفحه بتواند هدر را روشن یا تیره
 * کند — ماشینی که به وزن‌های هیروی همان قالب وصل بود و با آن‌ها حذف شد. اگر دور طراحی چنین
 * چیزی خواست، از روی `variant` خود بلوک هیرو بیاید، نه از یک context سراسری.
 */
export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  return (
    <header className="container relative z-20">
      <div className="flex justify-between py-8">
        <Link href="/">
          <Logo loading="eager" priority="high" />
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
