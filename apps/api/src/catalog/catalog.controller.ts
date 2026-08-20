import { Controller, Get, Header, Param, Query } from '@nestjs/common'
import type { InsurerDto, ProductCardDto, ProductDetailDto } from './catalog.dto'
import { CatalogService } from './catalog.service'
import { isReferenceKey, type ReferenceItem } from './reference.dto'
import { ReferenceService } from './reference.service'
import { AppException } from '../common/app.exception'

/**
 * Public and unauthenticated — browsing products has to work before login, which is the whole
 * point of quoting anonymously.
 *
 * The catalog changes rarely, so it carries a short cache lifetime. Behind Cloudflare that
 * turns the home screen into an edge hit instead of a database query per visitor.
 */
const CACHE = 'public, max-age=60, stale-while-revalidate=300'

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly reference: ReferenceService,
  ) {}

  @Get('products')
  @Header('Cache-Control', CACHE)
  listProducts(): Promise<ProductCardDto[]> {
    return this.catalog.listProducts()
  }

  @Get('products/:slug')
  @Header('Cache-Control', CACHE)
  getProduct(@Param('slug') slug: string): Promise<ProductDetailDto> {
    return this.catalog.getProduct(slug)
  }

  @Get('insurers')
  @Header('Cache-Control', CACHE)
  listInsurers(): Promise<InsurerDto[]> {
    return this.catalog.listInsurers()
  }

  /**
   * Every dropdown the wizards need, behind one key. Lists are returned whole rather than
   * paged: the client fetches once, caches, and filters locally — which is far better on a
   * phone than a request per keystroke. `q` exists for lists that outgrow that.
   */
  @Get('reference/:key')
  @Header('Cache-Control', CACHE)
  listReference(@Param('key') key: string, @Query('q') q?: string): Promise<ReferenceItem[]> {
    if (!isReferenceKey(key)) throw new AppException('NOT_FOUND')
    return this.reference.list(key, q)
  }
}
