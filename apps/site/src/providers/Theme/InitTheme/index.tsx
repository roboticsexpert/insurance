import Script from 'next/script'
import React from 'react'

import { defaultTheme, themeLocalStorageKey } from '../shared'

/**
 * تم را پیش از هیدریشن روی `html` می‌نشاند تا صفحه با رنگ درست رنگ بگیرد و نپرد.
 *
 * `prefers-color-scheme` عمداً خوانده نمی‌شود. نسخه‌ای که از قالب Payload آمده بود اگر
 * انتخاب ذخیره‌شده‌ای نبود سراغ تنظیم سیستم‌عامل می‌رفت، یعنی هر بازدیدکننده‌ای که
 * سیستمش تیره بود سایت را تیره می‌دید — تمی که هیچ بومی برایش کشیده نشده
 * (`docs/website/LANDING-PAGES.md`). حالا پیش‌فرض همیشه روشن است.
 *
 * وقتی طرح تیره رسید: این تابع دوباره `getImplicitPreference` می‌خواهد و
 * `ThemeSelector` باید به فوتر برگردد، وگرنه کسی راه بیرون‌آمدن ندارد.
 */
export const InitTheme: React.FC = () => {
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      dangerouslySetInnerHTML={{
        __html: `
  (function () {
    function themeIsValid(theme) {
      return theme === 'light' || theme === 'dark'
    }

    var preference = window.localStorage.getItem('${themeLocalStorageKey}')
    var themeToSet = themeIsValid(preference) ? preference : '${defaultTheme}'

    document.documentElement.setAttribute('data-theme', themeToSet)
  })();
  `,
      }}
      id="theme-script"
      strategy="beforeInteractive"
    />
  )
}
