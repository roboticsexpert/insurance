import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { createOrderSchema, type CreateOrderDto, type OrderDto } from './orders.dto'
import { OrdersService } from './orders.service'
import { PaymentsService, type StartPaymentResult } from '../payments/payments.service'

/**
 * Ordering requires an account — this is the OTP wall, placed at checkout rather than at the
 * door so the wizard and the price comparison stay open to anyone.
 */
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
  ) {}

  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderDto,
  ): Promise<OrderDto> {
    return this.orders.create(userId, body)
  }

  @Get(':id')
  findOne(@CurrentUser('userId') userId: string, @Param('id') id: string): Promise<OrderDto> {
    return this.orders.findById(id, userId)
  }

  /** Opens a payment attempt and hands back where to send the customer's browser. */
  @Post(':id/pay')
  pay(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<StartPaymentResult> {
    return this.payments.start(id, userId)
  }
}
