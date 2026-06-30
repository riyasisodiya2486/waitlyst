import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, rewardTiers } = body

    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }

    const client = await getDbClient()

    try {
      const campaignId = uuidv4()
      const slug = generateSlug(title)
      const now = new Date()

      await client.query(
        'INSERT INTO campaigns (id, founder_id, title, description, slug, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [campaignId, session.founderId, title, description || '', slug, 'live', now]
      )

      if (Array.isArray(rewardTiers) && rewardTiers.length > 0) {
        try {
          for (let i = 0; i < rewardTiers.length; i++) {
            const tier = rewardTiers[i]
            if (!tier?.rewardLabel || typeof tier?.minReferrals !== 'number') {
              continue
            }

            const tierId = uuidv4()
            await client.query(
              'INSERT INTO reward_tiers (id, campaign_id, min_referrals, reward_label, tier_order) VALUES ($1, $2, $3, $4, $5)',
              [tierId, campaignId, tier.minReferrals, tier.rewardLabel, i]
            )
          }
        } catch (tierError) {
          console.warn('[v0] Reward tier insert failed, campaign was still created:', tierError)
        }
      }

      await client.end()

      return NextResponse.json({
        id: campaignId,
        slug,
        title,
      })
    } catch (dbError) {
      await client.end()
      throw dbError
    }
  } catch (error) {
    console.error('[v0] Campaign creation error:', error)
    return NextResponse.json({ message: 'Failed to create campaign' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const client = await getDbClient()

    try {
      const result = await client.query(
        `SELECT
          c.id,
          c.title,
          c.slug,
          c.description,
          c.status,
          c.created_at,
          COUNT(p.id)::int AS signups,
          COALESCE(SUM(p.referral_count), 0)::int AS total_referrals
        FROM campaigns c
        LEFT JOIN participants p ON p.campaign_id = c.id
        WHERE c.founder_id = $1
        GROUP BY c.id, c.title, c.slug, c.description, c.status, c.created_at
        ORDER BY c.created_at DESC`,
        [session.founderId]
      )

      await client.end()

      return NextResponse.json(
        result.rows.map((row: any) => ({
          id: row.id,
          name: row.title,
          title: row.title,
          slug: row.slug,
          description: row.description,
          status: row.status,
          signups: Number(row.signups || 0),
          referralRate:
            Number(row.signups || 0) > 0
              ? Math.round((Number(row.total_referrals || 0) / Number(row.signups)) * 100)
              : 0,
          created: row.created_at,
        }))
      )
    } catch (dbError) {
      await client.end()
      throw dbError
    }
  } catch (error) {
    console.error('[v0] Campaign fetch error:', error)
    return NextResponse.json({ message: 'Failed to fetch campaigns' }, { status: 500 })
  }
}
