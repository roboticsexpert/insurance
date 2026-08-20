import { Module } from '@nestjs/common'
import { RatingModule } from '../rating/rating.module'
import { QuotesController } from './quotes.controller'
import { QuotesService } from './quotes.service'

@Module({
  imports: [RatingModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
