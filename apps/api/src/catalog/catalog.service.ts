import { Injectable } from '@nestjs/common'
import type { Insurer, Product } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import type { FaqItem, InsurerDto, ProductCardDto, ProductDetailDto } from './catalog.dto'

const toInsurerDto = (insurer: Insurer): InsurerDto => ({
  id: insurer.id,
  slug: insurer.slug,
  name: insurer.name,
  logoUrl: insurer.logoUrl,
  solvencyLevel: insurer.solvencyLevel,
  claimSatisfaction: insurer.claimSatisfaction,
  branchCount: insurer.branchCount,
})

const toCardDto = (product: Product): ProductCardDto => ({
  id: product.id,
  slug: product.slug,
  type: product.type,
  titleFa: product.titleFa,
  subtitleFa: product.subtitleFa,
  iconKey: product.iconKey,
  fulfillment: product.fulfillment,
  fromAmount: product.fromAmount,
  fromAmountIsSample: product.fromAmountIsSample,
})

/** `faq` is jsonb, so it arrives as `unknown`. Anything malformed is dropped, not thrown on. */
const toFaq = (value: unknown): FaqItem[] => {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is FaqItem =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as FaqItem).q === 'string' &&
      typeof (item as FaqItem).a === 'string',
  )
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(): Promise<ProductCardDto[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ sortWeight: 'asc' }, { titleFa: 'asc' }],
    })
    return products.map(toCardDto)
  }

  async getProduct(slug: string): Promise<ProductDetailDto> {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        offerings: {
          where: { isActive: true, insurer: { isActive: true } },
          orderBy: { sortWeight: 'asc' },
          include: { insurer: true },
        },
      },
    })

    // An inactive product is deliberately indistinguishable from a missing one.
    if (!product) throw new AppException('NOT_FOUND')

    return {
      ...toCardDto(product),
      descriptionFa: product.descriptionFa,
      highlightsFa: product.highlightsFa,
      faq: toFaq(product.faq),
      insurers: product.offerings.map((offering) => toInsurerDto(offering.insurer)),
    }
  }

  async listInsurers(): Promise<InsurerDto[]> {
    const insurers = await this.prisma.insurer.findMany({
      where: { isActive: true },
      orderBy: [{ sortWeight: 'asc' }, { name: 'asc' }],
    })
    return insurers.map(toInsurerDto)
  }
}
