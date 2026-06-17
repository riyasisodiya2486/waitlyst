import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/dsql'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature') || ''

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 400 })
    }

    // Dynamically import Stripe to avoid initialization errors during build
    const Stripe = require('stripe').default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any
      const customerId = subscription.customer

      await execute(`UPDATE founders SET plan = $1 WHERE stripe_customer_id = $2`, ['pro', customerId])
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      const customerId = subscription.customer

      await execute(`UPDATE founders SET plan = $1 WHERE stripe_customer_id = $2`, ['free', customerId])
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
