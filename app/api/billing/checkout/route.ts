import { NextRequest, NextResponse } from 'next/server'
import { createCustomer, createCheckoutSession } from '@/lib/stripe'
import { queryOne, execute } from '@/lib/dsql'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { founder_id, email, name, successUrl, cancelUrl } = body

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json({
        sessionId: 'cs_test_demo',
        url: cancelUrl,
      })
    }

    // Get or create Stripe customer
    let founder = await queryOne(`SELECT stripe_customer_id FROM founders WHERE id = $1`, [founder_id])

    let customerId = founder?.stripe_customer_id

    if (!customerId) {
      try {
        const customer = await createCustomer(email, name)
        customerId = customer.id

        await execute(`UPDATE founders SET stripe_customer_id = $1 WHERE id = $2`, [customerId, founder_id])
      } catch (err) {
        console.error('[v0] Failed to create Stripe customer:', err)
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
      }
    }

    try {
      const session = await createCheckoutSession(customerId, successUrl, cancelUrl)

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      })
    } catch (err) {
      console.error('[v0] Failed to create checkout session:', err)
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }
  } catch (error) {
    console.error('[v0] Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
