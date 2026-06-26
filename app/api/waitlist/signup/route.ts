import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDbClient } from '@/lib/db'
import { logReferralEvent } from '@/lib/dynamo'
import { nanoid } from 'nanoid'

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignSlug, email, referralCode } = body

    if (!campaignSlug || !email) {
      return NextResponse.json({ message: 'Missing campaignSlug or email' }, { status: 400 })
    }

    const client = await getDbClient()

    try {
      // Find campaign by slug
      const campaignResult = await client.query('SELECT id FROM campaigns WHERE slug = $1', [campaignSlug])

      if (campaignResult.rows.length === 0) {
        await client.end()
        return NextResponse.json({ message: 'Campaign not found' }, { status: 404 })
      }

      const campaignId = campaignResult.rows[0].id

      // Check if participant already exists
      const existing = await client.query(
        'SELECT id, rank, referral_code FROM participants WHERE campaign_id = $1 AND email = $2',
        [campaignId, email]
      )

      if (existing.rows.length > 0) {
        await client.end()
        return NextResponse.json({
          rank: existing.rows[0].rank,
          referralCode: existing.rows[0].referral_code,
        })
      }

      // Get current rank (count + 1)
      const countResult = await client.query('SELECT COUNT(*) FROM participants WHERE campaign_id = $1', [campaignId])
      const rank = parseInt(countResult.rows[0].count) + 1

      // Generate referral code
      const newReferralCode = nanoid(8)

      // Insert participant
      const participantId = uuidv4()
      const now = new Date()
      const ipAddress = getClientIp(request)

      await client.query(
        'INSERT INTO participants (id, campaign_id, email, rank, referral_code, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [participantId, campaignId, email, rank, newReferralCode, ipAddress, now]
      )

      // If referred by someone, update referrer
      if (referralCode) {
        const referrer = await client.query(
          'SELECT id FROM participants WHERE campaign_id = $1 AND referral_code = $2',
          [campaignId, referralCode]
        )

        if (referrer.rows.length > 0) {
          await client.query(
            'UPDATE participants SET referral_count = referral_count + 1 WHERE id = $1',
            [referrer.rows[0].id]
          )

          await client.query(
            'UPDATE participants SET referred_by = $1 WHERE id = $2',
            [referralCode, participantId]
          )
        }
      }

      await client.end()

      // Log to DynamoDB
      await logReferralEvent({
        campaignId,
        type: referralCode ? 'referral' : 'signup',
        email,
        ipAddress,
        referredBy: referralCode,
      })

      return NextResponse.json({
        rank,
        referralCode: newReferralCode,
      })
    } catch (dbError) {
      await client.end()
      throw dbError
    }
  } catch (error) {
    console.error('[v0] Waitlist signup error:', error)
    return NextResponse.json({ message: 'Failed to join waitlist' }, { status: 500 })
  }
}
