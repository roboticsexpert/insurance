import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ContentBlock } from '@/blocks/Content/Component'
import { CoverageListBlock } from '@/blocks/CoverageList/Component'
import { CtaBandBlock } from '@/blocks/CtaBand/Component'
import { FaqBlock } from '@/blocks/Faq/Component'
import { FeaturesBlock } from '@/blocks/Features/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { HeroBlock } from '@/blocks/Hero/Component'
import { InsurerStripBlock } from '@/blocks/InsurerStrip/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { OfferPreviewBlock } from '@/blocks/OfferPreview/Component'
import { PostsListBlock } from '@/blocks/PostsList/Component'
import { PriceFactorsBlock } from '@/blocks/PriceFactors/Component'
import { ProductGridBlock } from '@/blocks/ProductGrid/Component'
import { QuoteFormBlock } from '@/blocks/QuoteForm/Component'
import { StepsBlock } from '@/blocks/Steps/Component'
import { cn } from '@/utilities/ui'

const blockComponents = {
  content: ContentBlock,
  coverageList: CoverageListBlock,
  ctaBand: CtaBandBlock,
  faq: FaqBlock,
  features: FeaturesBlock,
  formBlock: FormBlock,
  hero: HeroBlock,
  insurerStrip: InsurerStripBlock,
  mediaBlock: MediaBlock,
  offerPreview: OfferPreviewBlock,
  postsList: PostsListBlock,
  priceFactors: PriceFactorsBlock,
  productGrid: ProductGridBlock,
  quoteForm: QuoteFormBlock,
  steps: StepsBlock,
}

type Block = Page['layout'][0]

/**
 * در طرح خانه و طرح صفحه محصول، هیرو و فرم استعلام یک نوار دو ستونی‌اند نه دو بخش
 * پشت سر هم. دو بلوک جدا ماندند (تصمیم `docs/website/LANDING-PAGES.md`: لندینگ
 * کمپین باید بتواند بدون هیرو یا با دو هیرو ساخته شود)، پس جفت‌شدن اینجا اتفاق
 * می‌افتد: هیروی «اصلی» یا «محصول» که بلافاصله بعدش فرم استعلام آمده باشد، با آن
 * یک نوار می‌شود. هر ترتیب دیگری همان دو بخش جدا می‌ماند.
 *
 * روی موبایلِ صفحه خانه فرم زیر هیرو نمی‌آید — طرح موبایل مستقیم از هیرو به فهرست
 * محصول‌ها می‌رود و استعلام از دکمه کارت محصول شروع می‌شود. روی صفحه محصول ولی
 * می‌آید: آنجا کارت محصولی در کار نیست و برداشتن فرم یعنی صفحه‌ای که روی موبایل
 * هیچ راهی به استعلام ندارد. (بوم موبایلِ صفحه محصول هنوز کشیده نشده؛ همان ستون
 * دسکتاپ زیر هیرو می‌نشیند.)
 */
export const RenderBlocks: React.FC<{
  blocks: Block[]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (!hasBlocks) return null

  const rendered: React.ReactNode[] = []

  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index] as Block
    const next = blocks[index + 1]

    if (
      block.blockType === 'hero' &&
      (block.variant === 'primary' || block.variant === 'product') &&
      next?.blockType === 'quoteForm'
    ) {
      const onProductPage = block.variant === 'product'

      rendered.push(
        <section
          className={cn(
            'shell grid gap-8 pb-0 lg:grid-cols-2 lg:items-start lg:gap-18 lg:pb-24',
            // بالای هیروی محصول نان‌ریزه نشسته، پس فاصله بالایش کمتر از صفحه خانه است.
            onProductPage ? 'pt-6 lg:pt-10' : 'items-center pt-8 lg:pt-18',
          )}
          key={index}
        >
          <HeroBlock {...block} asColumn />
          <div className={onProductPage ? '' : 'hidden lg:block'}>
            <QuoteFormBlock {...next} asColumn />
          </div>
        </section>,
      )
      index++
      continue
    }

    /*
     * در بوم مسافرتی و آتش‌سوزی، بخش «ویژگی‌ها» بلافاصله بالای «چه چیزی پوشش
     * می‌دهد» می‌نشیند و پدینگ پایین ندارد — فاصله را فقط بخش دوم می‌دهد. اینجا
     * هم همان: وگرنه پدینگ پایین یکی و پدینگ بالای دیگری روی هم می‌نشینند.
     */
    if (block.blockType === 'coverageList' && blocks[index - 1]?.blockType === 'features') {
      rendered.push(<CoverageListBlock {...block} key={index} tightTop />)
      continue
    }

    const { blockType } = block

    if (blockType && blockType in blockComponents) {
      const BlockComponent = blockComponents[blockType]

      if (BlockComponent) {
        rendered.push(
          // @ts-expect-error انواع بلوک‌ها با هم یکی نیستند و این نگاشت عمداً باز است
          <BlockComponent {...block} disableInnerContainer key={index} />,
        )
      }
    }
  }

  return <Fragment>{rendered}</Fragment>
}
