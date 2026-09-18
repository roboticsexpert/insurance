import { Module } from '@nestjs/common'
import { RATING_STRATEGIES } from './rating-strategy'
import { PrismaRatingLookups } from './rating.lookups'
import { RatingRegistry } from './rating.registry'
import { RatingService } from './rating.service'
import { HomeFireRatingStrategy } from './strategies/home-fire.strategy'
import { MotorTplRatingStrategy } from './strategies/motor-tpl.strategy'
import { TravelRatingStrategy } from './strategies/travel.strategy'

/**
 * Strategies are collected through one multi-provider array, so adding a product means adding
 * a class here and nothing else.
 */
@Module({
  providers: [
    RatingRegistry,
    PrismaRatingLookups,
    RatingService,
    TravelRatingStrategy,
    MotorTplRatingStrategy,
    HomeFireRatingStrategy,
    {
      provide: RATING_STRATEGIES,
      useFactory: (
        travel: TravelRatingStrategy,
        motor: MotorTplRatingStrategy,
        homeFire: HomeFireRatingStrategy,
      ) => [travel, motor, homeFire],
      inject: [TravelRatingStrategy, MotorTplRatingStrategy, HomeFireRatingStrategy],
    },
  ],
  exports: [RatingService, RatingRegistry, PrismaRatingLookups],
})
export class RatingModule {}
