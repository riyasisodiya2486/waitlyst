import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { nanoid } from 'nanoid'
import { getDbClient } from '@/lib/db'
import { logReferralEvent } from '@/lib/dynamo'

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
}

async function recomputeCampaignRanks(client: any, campaignId: string) {
  await client.query(
    `WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (
        ORDER BY COALESCE(referral_count, 0) DESC, created_at ASC, email ASC
      ) AS next_rank
      FROM participants
      WHERE campaign_id = $1
    )
    UPDATE participants p
    SET rank = ranked.next_rank
    FROM ranked
    WHERE p.id = ranked.id`,
    [campaignId],
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaign_id, email, referred_by } = body

    if (!campaign_id || !email) {
      return NextResponse.json({ error: 'Missing campaign_id or email' }, { status: 400 })
    }

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json({
        rank: Math.floor(Math.random() * 100) + 1,
        referralCode: nanoid(8),
      })
    }

    const client = await getDbClient()

    try {
      const campaignResult = await client.query('SELECT id FROM campaigns WHERE id = $1', [campaign_id])
      if (!campaignResult.rows.length) {
        await client.end()
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      const existing = await client.query(
        'SELECT id, rank, referral_code FROM participants WHERE campaign_id = $1 AND email = $2',
        [campaign_id, email],
      )
      if (existing.rows.length > 0) {
        await client.end()
        return NextResponse.json({ rank: existing.rows[0].rank, referralCode: existing.rows[0].referral_code })
      }

      const countResult = await client.query('SELECT COUNT(*) FROM participants WHERE campaign_id = $1', [campaign_id])
      const provisionalRank = parseInt(countResult.rows[0].count, 10) + 1
      const referralCode = nanoid(8)
      const participantId = uuidv4()
      const ipAddress = getClientIp(request)

      await client.query(
        'INSERT INTO participants (id, campaign_id, email, rank, referral_code, referred_by, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [participantId, campaign_id, email, provisionalRank, referralCode, referred_by || null, ipAddress, new Date()],
      )

      if (referred_by) {
        const referrer = await client.query(
          'SELECT id FROM participants WHERE campaign_id = $1 AND referral_code = $2',
          [campaign_id, referred_by],
        )
        if (referrer.rows.length > 0) {
          await client.query('UPDATE participants SET referral_count = COALESCE(referral_count, 0) + 1 WHERE id = $1', [referrer.rows[0].id])
        }
      }

      await recomputeCampaignRanks(client, campaign_id)

      const insertedParticipant = await client.query(
        'SELECT rank, referral_code FROM participants WHERE id = $1',
        [participantId],
      )

      await client.end()

      try {
        await logReferralEvent(campaign_id, referred_by ? 'referral' : 'signup', {
          email,
          referralCode,
          ipAddress,
          referredBy: referred_by,
        })
      } catch (logError) {
        console.warn('[v0] Referral logging failed silently:', logError)
      }

      return NextResponse.json({ rank: insertedParticipant.rows[0].rank, referralCode: insertedParticipant.rows[0].referral_code })
    } catch (dbError) {
      await client.end()
      throw dbError
    }
  } catch (error: any) {
    console.error('Failed to signup:', error)
    if (error?.message?.includes('unique')) {
      return NextResponse.json({ error: 'Email already signed up' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to signup' }, { status: 500 })
  }
}
