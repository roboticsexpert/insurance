import { Injectable, type PipeTransform } from '@nestjs/common'
import type { ZodTypeAny, ZodError } from 'zod'
import { AppException } from '../app.exception'

/** `a.b[0].c` → the path the web form uses to attach the message to a field. */
const pathToField = (path: (string | number)[]): string =>
  path.reduce<string>((acc, seg) => {
    if (typeof seg === 'number') return `${acc}[${seg}]`
    return acc ? `${acc}.${seg}` : seg
  }, '')

/** First message per field — a field with three complaints only needs the first one shown. */
export function zodErrorToFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = pathToField(issue.path) || '_'
    if (!(key in fields)) fields[key] = issue.message
  }
  return fields
}

/**
 * Validates a request payload against a zod schema and returns the parsed (and coerced) value.
 *
 *   @Post() create(@Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderDto)
 */
@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value)
    if (result.success) return result.data
    throw new AppException('VALIDATION_FAILED', { fields: zodErrorToFields(result.error) })
  }
}
