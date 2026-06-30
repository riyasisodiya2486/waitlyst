export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { getDbClient } from '@/lib/db'
import { CampaignDetailClient } from '@/components/campaign-detail-client'

export default async function CampaignDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
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

    if (!campaignResult.rows.length) {
      notFound()
    }

    const campaign = campaignResult.rows[0]
    const leaderboardResult = await client.query(
      `SELECT email, rank, referral_count
       FROM participants
       WHERE campaign_id = $1
       ORDER BY COALESCE(referral_count, 0) DESC, rank ASC, created_at ASC
       LIMIT 50`,
      [campaign.id]
    )

    return (
      <CampaignDetailClient
        initialCampaign={{
          id: campaign.id,
          name: campaign.title,
          title: campaign.title,
          slug: campaign.slug,
          status: campaign.status,
          signups: Number(campaign.signups || 0),
          referralRate: Number(campaign.signups || 0) > 0 ? Math.round((Number(campaign.total_referrals || 0) / Number(campaign.signups)) * 100) : 0,
        }}
        initialLeaderboard={leaderboardResult.rows}
      />
    )
  } finally {
    await client.end()
  }
}
