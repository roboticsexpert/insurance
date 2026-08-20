export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY')

export interface PaymentRequestInput {
  orderId: string
  /** Rial. Iranian gateways take Rial; some take Toman — check when swapping in a real one. */
  amount: number
  descriptionFa: string
  mobile?: string
}

export interface PaymentRequestResult {
  /** The gateway's handle for this attempt. ZarinPal calls it Authority. */
  authority: string
  /** Where to send the customer's browser. */
  redirectUrl: string
}

export interface PaymentVerifyResult {
  ok: boolean
  /** The gateway's receipt number, shown to the customer and used for reconciliation. */
  refId?: string
  cardMask?: string
  reasonFa?: string
}

/**
 * The seam a real Iranian IPG drops into, shaped like ZarinPal's two-step choreography:
 * request an authority → redirect the customer → they come back → verify server-to-server.
 *
 * `verify` is the only thing that may declare a payment successful. Never trust the browser's
 * return trip: the customer controls that URL.
 */
export interface PaymentGateway {
  readonly name: string
  request(input: PaymentRequestInput): Promise<PaymentRequestResult>
  verify(params: { authority: string; status?: string }): Promise<PaymentVerifyResult>
}
