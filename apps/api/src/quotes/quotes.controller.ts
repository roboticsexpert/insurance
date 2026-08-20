import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import { OptionalUser } from '../auth/current-user.decorator'
import type { AuthenticatedUser } from '../auth/authenticated-user'
import { OptionalJwtGuard } from '../auth/jwt-auth.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { createQuoteSchema, type CreateQuoteDto, type QuoteDto } from './quotes.dto'
import { QuotesService } from './quotes.service'

/**
 * Quoting works signed out. The OTP wall sits at checkout, not at the door — the wizard and
 * the price comparison are exactly where an unconvinced visitor decides whether to bother.
 */
@Controller('quotes')
@UseGuards(OptionalJwtGuard)
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(createQuoteSchema)) body: CreateQuoteDto,
    @OptionalUser() user?: AuthenticatedUser,
  ): Promise<QuoteDto> {
    return this.quotes.create(body.productSlug, body.input, user?.userId ?? null)
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @OptionalUser() user?: AuthenticatedUser,
  ): Promise<QuoteDto> {
    return this.quotes.findById(id, user?.userId ?? null)
  }
}
