import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { saveVehicleSchema, type SaveVehicleDto, type VehicleDto } from './vehicles.dto'
import { VehiclesService } from './vehicles.service'

/** Sits under `/me` because a saved vehicle belongs to an account and nowhere else. */
@Controller('me/vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  list(@CurrentUser('userId') userId: string): Promise<VehicleDto[]> {
    return this.vehicles.listForUser(userId)
  }

  @Post()
  save(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(saveVehicleSchema)) body: SaveVehicleDto,
  ): Promise<VehicleDto> {
    return this.vehicles.save(userId, body)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string): Promise<void> {
    return this.vehicles.remove(userId, id)
  }
}
