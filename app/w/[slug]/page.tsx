import { notFound } from 'next/navigation'
import { getDbClient } from '@/lib/db'
import { WaitlistPageClient } from '@/components/waitlist-page-client'

export default async function WaitlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { slug } = await params
  const { ref } = await searchParams
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
    const tiersResult = await client.query(
      'SELECT min_referrals, reward_label, tier_order FROM reward_tiers WHERE campaign_id = $1 ORDER BY tier_order ASC',
      [campaign.id]
    )
    const leaderboardResult = await client.query(
      'SELECT id, email, rank, referral_count FROM participants WHERE campaign_id = $1 ORDER BY rank ASC LIMIT 50',
      [campaign.id]
    )

    return (
      <WaitlistPageClient
        initialCampaign={{
          id: campaign.id,
          name: campaign.title,
          title: campaign.title,
          slug: campaign.slug,
          description: campaign.description,
          rewardTiers: tiersResult.rows.map((tier: any) => ({
            minReferrals: tier.min_referrals,
            rewardLabel: tier.reward_label,
          })),
        }}
        initialLeaderboard={leaderboardResult.rows}
        referralCodeFromUrl={ref}
      />
    )
  } finally {
    await client.end()
  }
}
