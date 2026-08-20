import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'
import { AppException } from '../app.exception'
import { ERROR_MESSAGE_FA, type ApiError, type ErrorCode } from '../errors'

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_FAILED',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_FAILED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
}

/**
 * Every failure leaves the API in the same shape: `{ statusCode, code, messageFa, requestId }`.
 * Nothing internal reaches the client — stack traces and driver messages are logged only.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request & { id?: string }>()
    const requestId = request.id

    const body = this.toApiError(exception, requestId)

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        { err: exception, requestId, path: request.url, method: request.method },
        'Unhandled exception',
      )
    } else {
      this.logger.warn(
        { code: body.code, requestId, path: request.url, method: request.method },
        'Request failed',
      )
    }

    response.status(body.statusCode).json(body)
  }

  private toApiError(exception: unknown, requestId: string | undefined): ApiError {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        messageFa: exception.message,
        ...(exception.fields ? { fields: exception.fields } : {}),
        ...(requestId ? { requestId } : {}),
      }
    }

    if (exception instanceof ThrottlerException) {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: 'RATE_LIMITED',
        messageFa: ERROR_MESSAGE_FA.RATE_LIMITED,
        ...(requestId ? { requestId } : {}),
      }
    }

    // P2025 = "record not found" on update/delete. The rest are our bugs, not the caller's.
    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2025') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        code: 'NOT_FOUND',
        messageFa: ERROR_MESSAGE_FA.NOT_FOUND,
        ...(requestId ? { requestId } : {}),
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const code = STATUS_TO_CODE[status] ?? 'INTERNAL'
      return {
        statusCode: status,
        code,
        messageFa: ERROR_MESSAGE_FA[code],
        ...(requestId ? { requestId } : {}),
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL',
      messageFa: ERROR_MESSAGE_FA.INTERNAL,
      ...(requestId ? { requestId } : {}),
    }
  }
}
