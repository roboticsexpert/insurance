import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t border-border">
      <div className="container flex flex-col gap-8 py-8 md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <div className="flex flex-col-reverse items-start gap-4 md:flex-row md:items-center">
          <ThemeSelector />
          <nav className="flex flex-col gap-4 md:flex-row">
            {navItems.map(({ link }, i) => {
              return <CMSLink key={i} {...link} />
            })}
          </nav>
        </div>
      </div>

      {(footerData?.legal || footerData?.licenseNumber) && (
        <div className="container border-t border-border py-4 text-sm text-muted-foreground">
          {footerData.legal && <p className="whitespace-pre-line">{footerData.legal}</p>}
          {footerData.licenseNumber && (
            <p className="mt-1">پروانه بیمه مرکزی: {footerData.licenseNumber}</p>
          )}
        </div>
      )}
    </footer>
  )
}
