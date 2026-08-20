import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: the process is up. Must not touch the database. */
  @Get()
  live(): { status: 'ok'; uptime: number } {
    return { status: 'ok', uptime: Math.round(process.uptime()) }
  }

  /** Readiness: the process can actually serve traffic. */
  @Get('ready')
  async ready(): Promise<{ status: 'ok' | 'degraded'; database: 'up' | 'down' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'ok', database: 'up' }
    } catch {
      return { status: 'degraded', database: 'down' }
    }
  }
}
