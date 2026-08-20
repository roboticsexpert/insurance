import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AppException } from '../common/app.exception'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { updateProfileSchema, type UpdateProfileDto } from './dto/update-profile.dto'
import { toUserDto, type UserDto } from './user.dto'
import { UsersService } from './users.service'

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async me(@CurrentUser('userId') userId: string): Promise<UserDto> {
    const user = await this.users.findById(userId)
    // The token verified, but the account is gone — treat it as an invalid session.
    if (!user) throw new AppException('UNAUTHORIZED')
    return toUserDto(user)
  }

  @Patch()
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileDto,
  ): Promise<UserDto> {
    return toUserDto(await this.users.updateProfile(userId, body))
  }
}
