'use client'
import Link from 'next/link'
import React, { useState } from 'react'

import type { Header } from '@/payload-types'

import { CloseIcon, MenuIcon } from '@/components/icons'
import { Logo } from '@/components/Logo/Logo'
import { CMSLink } from '@/components/Link'

interface HeaderClientProps {
  data: Header
}

/**
 * هدر سایت، از روی بوم `SiteHeader` و هدر موبایل صفحه خانه.
 *
 * قالب اصلی Payload اینجا یک `HeaderThemeProvider` داشت تا هر صفحه بتواند هدر را روشن یا تیره
 * کند — ماشینی که به وزن‌های هیروی همان قالب وصل بود و با آن‌ها حذف شد. طرح فعلی یک هدر
 * روشن دارد و بس.
 *
 * تنها دلیل کلاینت‌بودنش منوی موبایل است.
 */
export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = data?.navItems || []
  const login = data?.login?.[0]?.link
  const cta = data?.cta?.[0]?.link

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="shell flex h-16 items-center gap-12 lg:h-20">
        <Link aria-label="بیمه گلد، صفحه اصلی" className="flex items-center" href="/">
          <Logo className="h-6 lg:h-7" loading="eager" priority="high" />
        </Link>

        <nav aria-label="منوی اصلی" className="hidden grow items-center gap-1 lg:flex">
          {navItems.map(({ link }, i) => (
            <CMSLink
              className="flex h-11 items-center rounded-card px-3.5 text-[0.9375rem] font-medium text-foreground transition-colors hover:text-brand-700"
              key={i}
              {...link}
            />
          ))}
        </nav>

        <div className="flex grow items-center justify-end gap-2 lg:grow-0 lg:gap-3">
          {login && (
            <CMSLink
              className="flex h-11 items-center rounded-card border border-border px-3.5 text-sm font-semibold text-foreground transition-colors hover:border-brand-500 lg:px-[1.125rem] lg:text-[0.9375rem]"
              {...login}
            />
          )}
          {cta && (
            <CMSLink
              className="hidden h-11 items-center rounded-card bg-primary px-5 text-[0.9375rem] font-semibold text-primary-foreground shadow-button transition-opacity hover:opacity-90 lg:flex"
              {...cta}
            />
          )}
          <button
            aria-controls="site-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'بستن منو' : 'منو'}
            className="flex size-11 items-center justify-center rounded-card border border-border bg-card text-foreground lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border lg:hidden" id="site-menu">
          <nav
            aria-label="منوی اصلی"
            className="shell flex flex-col py-2"
            onClick={() => setMenuOpen(false)}
          >
            {navItems.map(({ link }, i) => (
              <CMSLink
                className="flex h-12 items-center text-[0.9375rem] font-medium text-foreground"
                key={i}
                {...link}
              />
            ))}
            {cta && (
              <CMSLink
                className="my-3 flex h-13 items-center justify-center rounded-card bg-primary text-[0.9375rem] font-semibold text-primary-foreground shadow-button"
                {...cta}
              />
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
