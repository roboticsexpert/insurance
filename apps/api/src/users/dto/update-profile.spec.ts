import { updateProfileSchema } from './update-profile.dto'

const valid = {
  firstName: 'مهدی',
  lastName: 'یوسف‌تبار',
  nationalCode: '0499370899',
  birthDate: '1990-05-20',
  email: 'a@b.com',
}

const errorFor = (input: object, field: string): string | undefined => {
  const result = updateProfileSchema.safeParse(input)
  if (result.success) return undefined
  return result.error.issues.find((i) => i.path[0] === field)?.message
}

describe('updateProfileSchema', () => {
  it('accepts a complete profile', () => {
    expect(updateProfileSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a national code typed with Persian digits and separators', () => {
    const parsed = updateProfileSchema.parse({ ...valid, nationalCode: '۰۴۹۹-۳۷۰-۸۹۹' })
    expect(parsed.nationalCode).toBe('0499370899')
  })

  it('rejects a national code that fails the checksum', () => {
    expect(errorFor({ ...valid, nationalCode: '1234567890' }, 'nationalCode')).toBe(
      'کد ملی معتبر نیست',
    )
  })

  it('rejects repdigit national codes, which pass the checksum but are not real', () => {
    expect(errorFor({ ...valid, nationalCode: '1111111111' }, 'nationalCode')).toBeDefined()
  })

  it('rejects a birth date in the future', () => {
    expect(errorFor({ ...valid, birthDate: '2099-01-01' }, 'birthDate')).toBe(
      'تاریخ تولد معتبر نیست',
    )
  })

  it('rejects an implausible age', () => {
    expect(errorFor({ ...valid, birthDate: '1850-01-01' }, 'birthDate')).toBeDefined()
  })

  it('allows the email to be omitted entirely', () => {
    const { email: _email, ...withoutEmail } = valid
    expect(updateProfileSchema.safeParse(withoutEmail).success).toBe(true)
  })

  it('rejects a malformed email', () => {
    expect(errorFor({ ...valid, email: 'nope' }, 'email')).toBe('ایمیل معتبر نیست')
  })

  it('trims names and rejects ones that are too short', () => {
    expect(updateProfileSchema.parse({ ...valid, firstName: '  علی  ' }).firstName).toBe('علی')
    expect(errorFor({ ...valid, firstName: 'ا' }, 'firstName')).toBe('حداقل ۲ حرف')
  })
})
