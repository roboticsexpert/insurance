import { Injectable } from '@nestjs/common'
import type { User } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import type { UpdateProfileDto } from './dto/update-profile.dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Accounts are created at first successful login, not when a code is requested — so an
   * attacker spraying OTP requests cannot fill the table with accounts that never exist.
   */
  async findOrCreateByMobile(mobile: string): Promise<{ user: User; isNew: boolean }> {
    const existing = await this.prisma.user.findUnique({ where: { mobile } })
    if (existing) return { user: existing, isNew: false }

    const user = await this.prisma.user.create({ data: { mobile } })
    return { user, isNew: true }
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  /**
   * Completing the profile is all-or-nothing: every field the schema requires is present by
   * the time this runs, so `isProfileComplete` is simply true afterwards. Checkout depends on
   * that flag, and a half-filled profile would fail at the worst possible moment.
   */
  updateProfile(userId: string, data: UpdateProfileDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        nationalCode: data.nationalCode,
        birthDate: new Date(data.birthDate),
        email: data.email ?? null,
        isProfileComplete: true,
      },
    })
  }
}
