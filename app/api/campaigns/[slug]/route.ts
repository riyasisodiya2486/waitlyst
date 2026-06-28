import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json({
        id: 'demo-campaign',
        name: 'Demo Campaign',
        title: 'Demo Campaign',
        slug,
        description: 'Demo campaign description',
        status: 'live',
        rewardTiers: [],
        signups: 2847,
        referralRate: 94,
      })
    }

    const client = await getDbClient()

    try {
      const campaignResult = await client.query(
        `SELECT
          c.id,
          c.title,
          c.slug,
          c.description,
          c.status,
          COUNT(p.id)::int AS signups,
          COALESCE(SUM(p.referral_count), 0)::int AS total_referrals
        FROM campaigns c
        LEFT JOIN participants p ON p.campaign_id = c.id
        WHERE c.slug = $1
        GROUP BY c.id, c.title, c.slug, c.description, c.status`,
        [slug]
      )

      if (campaignResult.rows.length === 0) {
        await client.end()
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      const campaign = campaignResult.rows[0]
      const tiersResult = await client.query(
        'SELECT min_referrals, reward_label, tier_order FROM reward_tiers WHERE campaign_id = $1 ORDER BY tier_order ASC',
        [campaign.id]
      )

      await client.end()

      return NextResponse.json({
        id: campaign.id,
        name: campaign.title,
        title: campaign.title,
        slug: campaign.slug,
        description: campaign.description,
        status: campaign.status,
        signups: Number(campaign.signups || 0),
        referralRate:
          Number(campaign.signups || 0) > 0
            ? Math.round((Number(campaign.total_referrals || 0) / Number(campaign.signups)) * 100)
            : 0,
        rewardTiers: tiersResult.rows.map((tier: any) => ({
          minReferrals: tier.min_referrals,
          rewardLabel: tier.reward_label,
          tierOrder: tier.tier_order,
        })),
      })
    } catch (dbError) {
      await client.end()
      throw dbError
    }
  } catch (error) {
    console.error('Failed to fetch campaign:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

