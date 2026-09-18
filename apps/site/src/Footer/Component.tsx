import Link from 'next/link'
import React from 'react'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { getCachedGlobal } from '@/utilities/getGlobals'

/**
 * فوتر سایت، از روی بوم `SiteFooter` و فوتر موبایل صفحه خانه.
 *
 * نماد اعتماد و مجوز بیمه مرکزی عمداً جای‌نگارند: هنوز صادر نشده‌اند و یک کادر خالی
 * با متن «[نماد اعتماد]» هیچ ادعایی نمی‌کند، برخلاف نشانی که آنجا بگذاریم. همین
 * قاعده برای شماره تماس و ایمیل هم هست.
 */
const Placeholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex size-20 items-center justify-center rounded-card bg-sunken p-1.5 text-center text-[0.625rem] leading-relaxed text-muted-foreground lg:size-22 lg:p-2 lg:text-[0.6875rem]">
    {children}
  </div>
)

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 2)()

  const columns = footerData?.columns || []

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="shell pt-8 lg:pt-16">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="flex flex-col gap-4 lg:col-span-4">
            <Link aria-label="بیمه گلد، صفحه اصلی" className="flex items-center" href="/">
              <Logo className="h-6 lg:h-7" />
            </Link>
            {footerData?.tagline && (
              <p className="max-w-[21.25rem] text-[0.9375rem] leading-[1.9] text-muted-foreground">
                {footerData.tagline}
              </p>
            )}
            <div className="flex flex-col gap-1.5 text-[0.9375rem]">
              <span>
                پشتیبانی:{' '}
                {footerData?.supportPhone ? (
                  <a className="text-muted-foreground" href={`tel:${footerData.supportPhone}`}>
                    {footerData.supportPhone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">[شماره تماس]</span>
                )}
              </span>
              <span>
                ایمیل:{' '}
                {footerData?.supportEmail ? (
                  <a className="text-muted-foreground" href={`mailto:${footerData.supportEmail}`}>
                    {footerData.supportEmail}
                  </a>
                ) : (
                  <span className="text-muted-foreground">[نشانی ایمیل]</span>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 lg:col-span-6 lg:grid-cols-3 lg:gap-x-6">
            {columns.map((column, i) => (
              <div className="flex flex-col gap-3.5" key={column.id ?? i}>
                <h2 className="text-sm font-bold lg:text-[0.9375rem]">{column.title}</h2>
                <ul className="flex flex-col gap-2.5 text-[0.8125rem] lg:text-sm">
                  {(column.navItems ?? []).map(({ link }, j) => (
                    <li key={j}>
                      <CMSLink
                        className="text-muted-foreground transition-colors hover:text-brand-700"
                        {...link}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex gap-3 lg:col-span-2 lg:justify-end">
            <Placeholder>[نماد اعتماد]</Placeholder>
            <Placeholder>[مجوز بیمه مرکزی]</Placeholder>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border py-4 text-[0.8125rem] text-muted-foreground lg:mt-12 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
          <p>© ۱۴۰۵ بیمه گلد. همه حقوق محفوظ است.</p>
          <p>
            {footerData?.licenseNumber
              ? `پروانه بیمه مرکزی: ${footerData.licenseNumber}`
              : '[شماره مجوز فعالیت]'}
          </p>
        </div>

        {footerData?.legal && (
          <p className="whitespace-pre-line border-t border-border py-4 text-[0.8125rem] text-muted-foreground">
            {footerData.legal}
          </p>
        )}
      </div>
    </footer>
  )
}
