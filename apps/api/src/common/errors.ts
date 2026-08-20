/**
 * Machine-readable error codes. The client branches on `code`; the user reads `messageFa`.
 * The API owns every Persian error string so wording is fixed in one place.
 */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',

  OTP_TOO_SOON: 'OTP_TOO_SOON',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_ATTEMPTS_EXCEEDED: 'OTP_ATTEMPTS_EXCEEDED',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',

  PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
  NO_ELIGIBLE_OFFERS: 'NO_ELIGIBLE_OFFERS',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
  QUOTE_NOT_YOURS: 'QUOTE_NOT_YOURS',

  ORDER_INVALID_TRANSITION: 'ORDER_INVALID_TRANSITION',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  ORDER_EXPIRED: 'ORDER_EXPIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_ALREADY_VERIFIED: 'PAYMENT_ALREADY_VERIFIED',
  ISSUE_FAILED: 'ISSUE_FAILED',
} as const
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export interface ApiError {
  statusCode: number
  code: ErrorCode
  messageFa: string
  requestId?: string
  /** Field-level messages, only for VALIDATION_FAILED. */
  fields?: Record<string, string>
}

/**
 * The user-facing Persian wording for every code. The client never composes error text —
 * it branches on `code` and prints `messageFa`, so wording changes land in one place.
 */
export const ERROR_MESSAGE_FA: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'اطلاعات واردشده کامل یا درست نیست.',
  UNAUTHORIZED: 'برای ادامه باید وارد حساب کاربری شوید.',
  FORBIDDEN: 'به این بخش دسترسی ندارید.',
  NOT_FOUND: 'موردی که دنبالش بودید پیدا نشد.',
  RATE_LIMITED: 'تعداد درخواست‌ها زیاد بود. کمی بعد دوباره تلاش کنید.',
  INTERNAL: 'مشکلی در سامانه پیش آمد. لطفاً دوباره تلاش کنید.',

  OTP_TOO_SOON: 'برای دریافت کد جدید کمی صبر کنید.',
  OTP_INVALID: 'کد واردشده درست نیست.',
  OTP_EXPIRED: 'مهلت این کد تمام شده است. کد جدید بگیرید.',
  OTP_ATTEMPTS_EXCEEDED: 'چند بار کد اشتباه وارد شد. لطفاً کد جدید بگیرید.',
  REFRESH_TOKEN_INVALID: 'نشست شما معتبر نیست. دوباره وارد شوید.',
  PROFILE_INCOMPLETE: 'برای ادامه، اطلاعات حساب خود را کامل کنید.',

  PRODUCT_UNAVAILABLE: 'این بیمه در حال حاضر قابل خرید نیست.',
  NO_ELIGIBLE_OFFERS: 'با این مشخصات فعلاً نرخی برای ارائه نداریم.',
  QUOTE_EXPIRED: 'مهلت این استعلام تمام شده است. لطفاً دوباره استعلام بگیرید.',
  QUOTE_NOT_YOURS: 'این استعلام متعلق به حساب شما نیست.',

  ORDER_INVALID_TRANSITION: 'این عملیات در وضعیت فعلی سفارش امکان‌پذیر نیست.',
  ORDER_ALREADY_PAID: 'این سفارش قبلاً پرداخت شده است.',
  ORDER_EXPIRED: 'مهلت پرداخت این سفارش تمام شده است.',
  PAYMENT_FAILED: 'پرداخت انجام نشد. اگر مبلغی کسر شده، تا ۷۲ ساعت بازمی‌گردد.',
  PAYMENT_ALREADY_VERIFIED: 'این پرداخت قبلاً تأیید شده است.',
  ISSUE_FAILED: 'پرداخت انجام شد اما صدور بیمه‌نامه با خطا مواجه شد. پشتیبانی پیگیری می‌کند.',
}

/** Default HTTP status per code, so throw sites only have to name the code. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL: 500,

  OTP_TOO_SOON: 429,
  OTP_INVALID: 422,
  OTP_EXPIRED: 410,
  OTP_ATTEMPTS_EXCEEDED: 429,
  REFRESH_TOKEN_INVALID: 401,
  PROFILE_INCOMPLETE: 409,

  PRODUCT_UNAVAILABLE: 409,
  NO_ELIGIBLE_OFFERS: 422,
  QUOTE_EXPIRED: 410,
  QUOTE_NOT_YOURS: 403,

  ORDER_INVALID_TRANSITION: 409,
  ORDER_ALREADY_PAID: 409,
  ORDER_EXPIRED: 410,
  PAYMENT_FAILED: 402,
  PAYMENT_ALREADY_VERIFIED: 409,
  ISSUE_FAILED: 500,
}
