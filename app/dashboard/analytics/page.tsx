export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'
import { Navigation } from '@/components/navigation'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

export default async function AnalyticsPage() {
  const session = await getSession()
  const client = await getDbClient()

  try {
    const summaryResult = await client.query(
      `SELECT
        COUNT(DISTINCT c.id)::int AS total_campaigns,
        COUNT(p.id)::int AS total_signups,
        COALESCE(AVG(p.referral_count), 0)::float AS average_referral_rate
       FROM campaigns c
       LEFT JOIN participants p ON p.campaign_id = c.id
       WHERE c.founder_id = $1`,
      [session?.founderId],
    )

    const campaignsResult = await client.query(
      `SELECT
        c.id,
        c.title,
        COUNT(p.id)::int AS signup_count,
        COALESCE(MAX(p.referral_count), 0)::int AS top_referrer_count
       FROM campaigns c
       LEFT JOIN participants p ON p.campaign_id = c.id
       WHERE c.founder_id = $1
       GROUP BY c.id, c.title, c.created_at
       ORDER BY c.created_at DESC`,
      [session?.founderId],
    )

    const summary = summaryResult.rows[0] || {
      total_campaigns: 0,
      total_signups: 0,
      average_referral_rate: 0,
    }

    const totalCampaigns = Number(summary.total_campaigns || 0)
    const totalSignups = Number(summary.total_signups || 0)
    const averageReferralRate = Math.round(Number(summary.average_referral_rate || 0) * 10) / 10
    const campaigns = campaignsResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      signupCount: Number(row.signup_count || 0),
      topReferrerCount: Number(row.top_referrer_count || 0),
    }))

    return (
      <main className="relative min-h-screen bg-[#080808] text-[#F0EDE6]">
        <Navigation />
        <DashboardSidebar />

        <div className="px-4 pb-28 pt-20 md:ml-14 md:px-6 md:pb-8 lg:ml-[200px] lg:px-8">
          <div className="mx-auto max-w-[1200px] space-y-8">
            <div>
              <h1 className="instrument-serif text-[28px] sm:text-[32px]">Analytics</h1>
              <p className="mt-2 text-[14px] text-[#8A8782]">A simple rollup of real campaign performance from your active database.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
                <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Total Signups</div>
                <div className="mt-2 dm-mono text-[32px] sm:text-[36px] text-[#C8F135]">{totalSignups}</div>
              </div>
              <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
                <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Campaigns</div>
                <div className="mt-2 dm-mono text-[32px] sm:text-[36px] text-[#C8F135]">{totalCampaigns}</div>
              </div>
              <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
                <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Avg Referral Rate</div>
                <div className="mt-2 dm-mono text-[32px] sm:text-[36px] text-[#C8F135]">{averageReferralRate}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F]">
              <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-4 sm:px-6">
                <h2 className="dm-mono text-[12px] uppercase text-[#5C5955]">Per-Campaign Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)] text-[12px] uppercase text-[#5C5955]">
                      <th className="px-4 py-4 sm:px-6">Campaign</th>
                      <th className="px-4 py-4 sm:px-6">Signups</th>
                      <th className="px-4 py-4 sm:px-6">Top Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!campaigns.length ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 sm:px-6 text-[14px] text-[#8A8782]">
                          No campaigns yet. Create one from the main dashboard to start collecting analytics.
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-b border-[rgba(255,255,255,0.04)] text-[13px] last:border-b-0">
                          <td className="px-4 py-4 sm:px-6 text-[#F0EDE6]">{campaign.title}</td>
                          <td className="px-4 py-4 sm:px-6 dm-mono text-[#F0EDE6]">{campaign.signupCount}</td>
                          <td className="px-4 py-4 sm:px-6 dm-mono text-[#C8F135]">+{campaign.topReferrerCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  } finally {
    await client.end()
  }
}


