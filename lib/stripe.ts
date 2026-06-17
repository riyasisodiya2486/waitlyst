import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripe() {
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-15',
    })
  }
  return stripeInstance
}

export async function createCheckoutSession(
  customerId: string,
  successUrl: string,
  cancelUrl: string
) {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID || 'price_1234567890',
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}

export async function getCustomer(customerId: string) {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.customers.retrieve(customerId)
}

export async function createCustomer(email: string, name?: string) {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.customers.create({
    email,
    name,
  })
}
