import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-15.acacia',
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ message: 'Stripe is not configured' }, { status: 503 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const client = await getDbClient()

    try {
      // Get founder details
      const founderResult = await client.query('SELECT email, stripe_customer_id FROM founders WHERE id = $1', [
        session.founderId,
      ])

      if (founderResult.rows.length === 0) {
        await client.end()
        return NextResponse.json({ message: 'Founder not found' }, { status: 404 })
      }

      const founder = founderResult.rows[0]
      let customerId = founder.stripe_customer_id

      // Create or retrieve Stripe customer
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: founder.email,
          metadata: {
            founderId: session.founderId,
          },
        })
        customerId = customer.id

        // Update founder with Stripe customer ID
        await client.query('UPDATE founders SET stripe_customer_id = $1 WHERE id = $2', [
          customerId,
          session.founderId,
        ])
      }

      // Create checkout session
      const priceId = process.env.STRIPE_PRICE_ID
      if (!priceId) {
        await client.end()
        return NextResponse.json({ message: 'STRIPE_PRICE_ID not configured' }, { status: 500 })
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?upgrade=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing`,
      })

      await client.end()

      return NextResponse.json({
        url: checkoutSession.url,
      })
    } catch (dbError) {
      await client.end()
      throw dbError
    }
  } catch (error) {
    console.error('[v0] Checkout error:', error)
    return NextResponse.json({ message: 'Failed to create checkout session' }, { status: 500 })
  }
}
