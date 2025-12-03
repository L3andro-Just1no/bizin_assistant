import Stripe from 'stripe'

// Initialize Stripe client lazily to avoid build-time errors
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  }
  return _stripe
}

// For backwards compatibility - use lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe]
  }
})

export const STRIPE_CONFIG = {
  // One-time payment for a paid session
  paidSessionPrice: 4900, // €49.00 in cents
  currency: 'eur',
  
  // Subscription plan (for future use)
  subscriptionPriceId: process.env.STRIPE_SUBSCRIPTION_PRICE_ID,
}

