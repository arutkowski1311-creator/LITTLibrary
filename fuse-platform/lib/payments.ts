// Payment provider boundary. Everything else in the app talks to this
// interface, never to Stripe directly — so going live later is swapping
// FakeStripe for a StripeConnect implementation, not a rewrite.

export interface ChargeInput {
  orderId: string
  grossCents: number
}
export interface ChargeResult {
  intent: string
  feeCents: number // processor fee
  platformFeeCents: number // facilitation fee (our cut)
}

export interface PaymentProvider {
  charge(input: ChargeInput): Promise<ChargeResult>
}

/**
 * No Stripe account required. Computes Stripe-like fees (2.9% + 30¢) plus a 2%
 * facilitation fee, and returns a deterministic fake payment-intent id. The
 * caller then invokes the DB function record_payment(...), which mirrors the
 * payment and posts the balanced ledger entries — the same call the real
 * Stripe webhook will make in production.
 */
export class FakeStripe implements PaymentProvider {
  async charge({ orderId, grossCents }: ChargeInput): Promise<ChargeResult> {
    const feeCents = Math.round(grossCents * 0.029) + 30
    const platformFeeCents = Math.round(grossCents * 0.02)
    const intent = `pi_fake_${orderId.slice(0, 8)}_${grossCents}`
    return { intent, feeCents, platformFeeCents }
  }
}

export const payments: PaymentProvider = new FakeStripe()
