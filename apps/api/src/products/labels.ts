import { OrderStatus, ProductType } from '@prisma/client'

/**
 * Persian labels for the enums Prisma generates. The enums themselves live in
 * schema.prisma — this file only names them for humans.
 */
export const PRODUCT_TYPE_FA: Record<ProductType, string> = {
  TRAVEL: 'بیمه مسافرتی',
  MOTOR_TPL: 'بیمه شخص ثالث',
  HOME_FIRE: 'بیمه آتش‌سوزی منزل',
}

export const ORDER_STATUS_FA: Record<OrderStatus, string> = {
  DRAFT: 'پیش‌نویس',
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PAYMENT_FAILED: 'پرداخت ناموفق',
  PAID: 'پرداخت‌شده',
  ISSUING: 'در حال صدور',
  ISSUED: 'صادر شده',
  ISSUE_FAILED: 'خطا در صدور',
  CANCELLED: 'لغو شده',
}

/** A line on the premium invoice. Levies and tax stay separate from premium. */
export const LineItemKind = {
  PREMIUM: 'PREMIUM',
  DISCOUNT: 'DISCOUNT',
  TAX: 'TAX',
  FEE: 'FEE',
} as const
export type LineItemKind = (typeof LineItemKind)[keyof typeof LineItemKind]
