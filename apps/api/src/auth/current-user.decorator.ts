import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import { AppException } from '../common/app.exception'
import type { AuthenticatedUser } from './authenticated-user'

/**
 * `@CurrentUser()` → the whole payload · `@CurrentUser('userId')` → just that field.
 *
 * Throws when the route is not actually guarded, so a missing guard fails loudly at the first
 * request instead of silently handing the handler `undefined`.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<Request>()
    const user = req.user
    if (!user) throw new AppException('UNAUTHORIZED')
    return field ? user[field] : user
  },
)

/** Same, but for routes behind `OptionalJwtGuard`, where absent is a legitimate answer. */
export const OptionalUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined =>
    context.switchToHttp().getRequest<Request>().user,
)
