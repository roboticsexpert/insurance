import type { User } from '@prisma/client'

export interface UserDto {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
  nationalCode: string | null
  birthDate: string | null
  email: string | null
  isProfileComplete: boolean
}

/** The only shape a user ever leaves the API in. Nothing else on the row is public. */
export const toUserDto = (user: User): UserDto => ({
  id: user.id,
  mobile: user.mobile,
  firstName: user.firstName,
  lastName: user.lastName,
  nationalCode: user.nationalCode,
  birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
  email: user.email,
  isProfileComplete: user.isProfileComplete,
})
