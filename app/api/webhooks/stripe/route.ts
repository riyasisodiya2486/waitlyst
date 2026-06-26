import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-15.acacia',
    })
  : null

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ message: 'Stripe is not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ message: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || '')
  } catch (error) {
    console.error('[v0] Webhook signature verification failed:', error)
    return NextResponse.json({ message: 'Webhook signature verification failed' }, { status: 400 })
  }

  const client = await getDbClient()

  try {
    if (event.type === 'checkout.session.completed') {
      const checkoutSession = event.data.object as Stripe.Checkout.Session

      if (checkoutSession.customer && checkoutSession.subscription) {
        // Update founder plan to pro
        await client.query(
          'UPDATE founders SET plan = $1 WHERE stripe_customer_id = $2',
          ['pro', checkoutSession.customer as string]
        )
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription

      if (subscription.customer) {
        // Downgrade founder plan to free
        await client.query(
          'UPDATE founders SET plan = $1 WHERE stripe_customer_id = $2',
          ['free', subscription.customer as string]
        )
      }
    }

    await client.end()
    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    await client.end()
    console.error('[v0] Webhook processing error:', error)
    return NextResponse.json({ message: 'Webhook processing failed' }, { status: 500 })
  }
}
