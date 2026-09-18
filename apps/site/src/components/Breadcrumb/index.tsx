import Link from 'next/link'
import React from 'react'

import { ArrowIcon } from '@/components/icons'

/**
 * نان‌ریزه بالای صفحه‌های داخلی، از روی بوم «صفحه محصول — شخص ثالث».
 *
 * بلوک نیست و در پیشخان انتخاب نمی‌شود: در طرح هم «(auto)» علامت خورده. مسیر یک
 * پله دارد — خانه و همین صفحه — چون صفحه‌ها تودرتو نیستند و `pages` سلسله‌مراتب
 * ندارد. اگر روزی داشت، پله‌های میانی از همان‌جا می‌آیند نه از دست ویراستار.
 */
export const Breadcrumb: React.FC<{ title: string }> = ({ title }) => (
  <nav aria-label="مسیر صفحه" className="shell flex items-center gap-2 pt-5 text-sm lg:pt-6">
    <Link className="text-muted-foreground transition-colors hover:text-foreground" href="/">
      خانه
    </Link>
    <ArrowIcon className="shrink-0 text-muted-foreground" size={14} />
    <span aria-current="page">{title}</span>
  </nav>
)
