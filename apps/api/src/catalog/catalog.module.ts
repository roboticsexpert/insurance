import { Module } from '@nestjs/common'
import { CatalogController } from './catalog.controller'
import { CatalogService } from './catalog.service'
import { ReferenceService } from './reference.service'

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, ReferenceService],
  exports: [CatalogService, ReferenceService],
})
export class CatalogModule {}
