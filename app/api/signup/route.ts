import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { query, execute } from '@/lib/dsql'
import { logReferralEvent, putFraudSignal } from '@/lib/dynamo'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { campaign_id, email, referred_by } = body

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json({
        rank: Math.floor(Math.random() * 100) + 1,
        referralCode: uuidv4().substring(0, 8),
      })
    }

    const referralCode = uuidv4().substring(0, 8)
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'

    // Insert participant
    const result = await query(
      `INSERT INTO participants (campaign_id, email, referral_code, referred_by, ip_address) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, rank`,
      [campaign_id, email, referralCode, referred_by || null, ipAddress]
    )

    const participant = result[0]

    // Log to DynamoDB
    await logReferralEvent(campaign_id, 'signup', {
      email,
      referralCode,
      ipAddress,
      referredBy: referred_by,
    })

    return NextResponse.json({
      rank: participant.rank || Math.floor(Math.random() * 100) + 1,
      referralCode,
    })
  } catch (error: any) {
    console.error('Failed to signup:', error)
    if (error.message?.includes('unique')) {
      return NextResponse.json({ error: 'Email already signed up' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to signup' }, { status: 500 })
  }
}
