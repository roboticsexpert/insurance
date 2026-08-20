import { OrderStatus } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { assertTransition, canTransition, isTerminal } from './order-status'

describe('order state machine', () => {
  it('allows the whole happy path', () => {
    const path = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.ISSUING,
      OrderStatus.ISSUED,
    ]
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i] as OrderStatus, path[i + 1] as OrderStatus)).toBe(true)
    }
  })

  // A declined card is a retry, not a dead order.
  it('lets a failed payment be retried', () => {
    expect(canTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED)).toBe(true)
    expect(canTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING_PAYMENT)).toBe(true)
  })

  // The customer's money is already taken, so support must be able to re-drive issuance.
  it('lets a failed issuance be retried', () => {
    expect(canTransition(OrderStatus.ISSUING, OrderStatus.ISSUE_FAILED)).toBe(true)
    expect(canTransition(OrderStatus.ISSUE_FAILED, OrderStatus.ISSUING)).toBe(true)
  })

  it.each([
    ['skip payment entirely', OrderStatus.PENDING_PAYMENT, OrderStatus.ISSUED],
    ['issue without paying', OrderStatus.PENDING_PAYMENT, OrderStatus.ISSUING],
    ['unpay an order', OrderStatus.PAID, OrderStatus.PENDING_PAYMENT],
    ['cancel a paid order', OrderStatus.PAID, OrderStatus.CANCELLED],
    ['cancel after issuing', OrderStatus.ISSUED, OrderStatus.CANCELLED],
    ['re-issue a policy', OrderStatus.ISSUED, OrderStatus.ISSUING],
    ['revive a cancelled order', OrderStatus.CANCELLED, OrderStatus.PENDING_PAYMENT],
  ])('refuses to %s', (_label, from, to) => {
    expect(canTransition(from, to)).toBe(false)
    expect(() => assertTransition(from, to)).toThrow(AppException)
  })

  it('explains an already-issued order in its own words', () => {
    try {
      assertTransition(OrderStatus.ISSUED, OrderStatus.ISSUING)
      fail('expected a throw')
    } catch (error) {
      expect((error as AppException).code).toBe('ORDER_INVALID_TRANSITION')
      expect((error as AppException).message).toBe('این سفارش قبلاً صادر شده است.')
    }
  })

  it('treats ISSUED and CANCELLED as terminal, and nothing else', () => {
    const terminal = Object.values(OrderStatus).filter(isTerminal)
    expect(terminal.sort()).toEqual([OrderStatus.CANCELLED, OrderStatus.ISSUED].sort())
  })

  // A paid order that cannot be issued must never be a dead end.
  it('leaves a route out of every non-terminal status', () => {
    for (const status of Object.values(OrderStatus)) {
      if (isTerminal(status)) continue
      const reachable = Object.values(OrderStatus).filter((to) => canTransition(status, to))
      expect(reachable.length).toBeGreaterThan(0)
    }
  })
})
