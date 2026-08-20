import { Test } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from './notifications.service'
import { SMS_SENDER, type SmsSender } from './sms-sender'

describe('NotificationsService', () => {
  const create = jest.fn()
  let sender: jest.Mocked<SmsSender>
  let service: NotificationsService

  beforeEach(async () => {
    create.mockReset().mockResolvedValue({})
    sender = { send: jest.fn().mockResolvedValue({ providerRef: 'console:abc' }) }

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: { smsLog: { create } } },
        { provide: SMS_SENDER, useValue: sender },
      ],
    })
      .setLogger({ log: () => {}, error: () => {}, warn: () => {}, debug: () => {}, verbose: () => {} })
      .compile()

    service = moduleRef.get(NotificationsService)
  })

  it('sends the live body but persists the redacted one', async () => {
    await service.send('9123456789', 'OTP_LOGIN', { code: '4821' })

    expect(sender.send).toHaveBeenCalledWith({
      mobile: '9123456789',
      body: expect.stringContaining('4821'),
    })

    const logged = create.mock.calls[0][0].data
    expect(logged.body).not.toContain('4821')
    expect(logged).toMatchObject({
      mobile: '9123456789',
      template: 'OTP_LOGIN',
      status: 'SENT',
      providerRef: 'console:abc',
    })
  })

  // An SMS outage must not take a policy issuance down with it.
  it('swallows a provider failure and records it as FAILED', async () => {
    sender.send.mockRejectedValue(new Error('provider down'))

    await expect(
      service.send('9123456789', 'POLICY_ISSUED', {
        policyNumber: 'X-1',
        productTitleFa: 'بیمه مسافرتی',
      }),
    ).resolves.toBeUndefined()

    expect(create.mock.calls[0][0].data).toMatchObject({ status: 'FAILED', providerRef: null })
  })

  // Losing an audit row is bad; failing the caller over it is worse.
  it('survives the audit write itself failing', async () => {
    create.mockRejectedValue(new Error('db down'))
    await expect(
      service.send('9123456789', 'PAYMENT_FAILED', { amountRial: 1_000_000 }),
    ).resolves.toBeUndefined()
  })
})
