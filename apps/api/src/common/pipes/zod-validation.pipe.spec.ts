import { z } from 'zod'
import { AppException } from '../app.exception'
import { ZodValidationPipe } from './zod-validation.pipe'

const schema = z.object({
  mobile: z.string().regex(/^9\d{9}$/, { message: 'شماره موبایل معتبر نیست' }),
  age: z.coerce.number().int().min(18, { message: 'سن باید حداقل ۱۸ باشد' }),
  travelers: z.array(z.object({ name: z.string().min(2, { message: 'نام کوتاه است' }) })).optional(),
})

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(schema)

  it('returns the parsed value with coercions applied', () => {
    expect(pipe.transform({ mobile: '9123456789', age: '30' })).toEqual({
      mobile: '9123456789',
      age: 30,
    })
  })

  it('throws VALIDATION_FAILED with a field-keyed Persian message', () => {
    try {
      pipe.transform({ mobile: '0912', age: 15 })
      fail('expected the pipe to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(AppException)
      const e = error as AppException
      expect(e.code).toBe('VALIDATION_FAILED')
      expect(e.getStatus()).toBe(422)
      expect(e.fields).toEqual({ mobile: 'شماره موبایل معتبر نیست', age: 'سن باید حداقل ۱۸ باشد' })
    }
  })

  it('flattens nested and array paths the way the web form addresses them', () => {
    try {
      pipe.transform({ mobile: '9123456789', age: 30, travelers: [{ name: 'a' }] })
      fail('expected the pipe to throw')
    } catch (error) {
      expect((error as AppException).fields).toEqual({ 'travelers[0].name': 'نام کوتاه است' })
    }
  })
})
