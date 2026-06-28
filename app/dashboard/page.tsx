import { getSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'
import { DashboardPageClient } from '@/components/dashboard-page-client'

export default async function DashboardPage() {
  const session = await getSession()
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
      [session?.founderId]
    )

    const campaigns = result.rows.map((row: any) => ({
      id: row.id,
      name: row.title,
      title: row.title,
      slug: row.slug,
      description: row.description,
      status: row.status,
      signups: Number(row.signups || 0),
      referralRate: Number(row.signups || 0) > 0 ? Math.round((Number(row.total_referrals || 0) / Number(row.signups)) * 100) : 0,
      created: row.created_at,
    }))

    return <DashboardPageClient initialCampaigns={campaigns} />
  } finally {
    await client.end()
  }
}
