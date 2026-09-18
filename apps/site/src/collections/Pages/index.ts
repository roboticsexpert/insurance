import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Content } from '../../blocks/Content/config'
import { CoverageList } from '../../blocks/CoverageList/config'
import { CtaBand } from '../../blocks/CtaBand/config'
import { Faq } from '../../blocks/Faq/config'
import { Features } from '../../blocks/Features/config'
import { FormBlock } from '../../blocks/Form/config'
import { Hero } from '../../blocks/Hero/config'
import { InsurerStrip } from '../../blocks/InsurerStrip/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { OfferPreview } from '../../blocks/OfferPreview/config'
import { PostsList } from '../../blocks/PostsList/config'
import { PriceFactors } from '../../blocks/PriceFactors/config'
import { ProductGrid } from '../../blocks/ProductGrid/config'
import { QuoteForm } from '../../blocks/QuoteForm/config'
import { Steps } from '../../blocks/Steps/config'
import { slugFieldFa } from '@/fields/slugFa'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

/**
 * صفحه‌ها همه بلوکی‌اند — هیرو هم یک بلوک است، نه یک تب جدا (قالب اصلی Payload آن را
 * جدا می‌کرد). دلیلش `docs/website/LANDING-PAGES.md` است: لندینگ کمپین باید بتواند بدون
 * هیرو یا با دو هیرو ساخته شود.
 */
export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  labels: { singular: 'صفحه', plural: 'صفحه‌ها' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'محتوا',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'چیدمان',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              label: false,
              blocks: [
                Hero,
                QuoteForm,
                ProductGrid,
                Steps,
                Features,
                InsurerStrip,
                OfferPreview,
                CoverageList,
                PriceFactors,
                Faq,
                PostsList,
                CtaBand,
                Content,
                MediaBlock,
                FormBlock,
              ],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
        },
        {
          name: 'meta',
          label: 'سئو',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'تاریخ انتشار',
      admin: {
        position: 'sidebar',
      },
    },
    slugFieldFa(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
