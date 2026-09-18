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

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (!hasBlocks) return null

  return (
    <Fragment>
      {blocks.map((block, index) => {
        const { blockType } = block

        if (blockType && blockType in blockComponents) {
          const Block = blockComponents[blockType]

          if (Block) {
            // @ts-expect-error انواع بلوک‌ها با هم یکی نیستند و این نگاشت عمداً باز است
            return <Block {...block} key={index} disableInnerContainer />
          }
        }
        return null
      })}
    </Fragment>
  )
}
