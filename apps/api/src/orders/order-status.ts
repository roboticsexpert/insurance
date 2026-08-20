import { OrderStatus } from '@prisma/client'
import { AppException } from '../common/app.exception'

/**
 * The only transitions that may happen, as a table rather than scattered `if` statements.
 *
 * Orders are created straight into PENDING_PAYMENT — an order exists because someone chose to
 * buy. DRAFT is kept for a future save-and-return flow and currently has no producer.
 *
 * PAYMENT_FAILED → PENDING_PAYMENT is deliberate: a declined card is a retry, not a dead order.
 * ISSUED and CANCELLED are terminal; ISSUE_FAILED is not, because support re-drives issuance
 * after a paid order fails to issue — the customer's money is already taken.
 */
const ALLOWED: Record<OrderStatus, readonly OrderStatus[]> = {
  DRAFT: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
  PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
  PAYMENT_FAILED: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
  PAID: [OrderStatus.ISSUING],
  ISSUING: [OrderStatus.ISSUED, OrderStatus.ISSUE_FAILED],
  ISSUE_FAILED: [OrderStatus.ISSUING],
  ISSUED: [],
  CANCELLED: [],
}

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean =>
  ALLOWED[from].includes(to)

/**
 * Throws rather than returning false: an illegal transition is a bug in the caller, and money
 * has already moved by the time most of these run. Failing loudly beats a silent no-op.
 */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new AppException('ORDER_INVALID_TRANSITION', {
      messageFa:
        from === OrderStatus.ISSUED
          ? 'این سفارش قبلاً صادر شده است.'
          : 'این عملیات در وضعیت فعلی سفارش امکان‌پذیر نیست.',
    })
  }
}

/** Statuses from which nothing further can happen. */
export const isTerminal = (status: OrderStatus): boolean => ALLOWED[status].length === 0
