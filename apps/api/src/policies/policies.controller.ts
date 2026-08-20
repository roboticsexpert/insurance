import { Controller, Get, Header, Param, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { PolicyDetailDto, PolicyListItemDto } from './policies.dto'
import { PoliciesService } from './policies.service'

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Get()
  list(@CurrentUser('userId') userId: string): Promise<PolicyListItemDto[]> {
    return this.policies.listForUser(userId)
  }

  @Get(':id')
  findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<PolicyDetailDto> {
    return this.policies.findForUser(id, userId)
  }

  /**
   * The printable policy. Served as HTML with a print stylesheet — the browser's own print
   * dialog produces the PDF a customer needs for a visa appointment.
   */
  @Get(':id/document')
  @Header('Content-Type', 'text/html; charset=utf-8')
  // Contains the customer's identity documents; never let a shared cache hold it.
  @Header('Cache-Control', 'private, no-store')
  async document(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    res.send(await this.policies.renderDocument(id, userId))
  }
}
