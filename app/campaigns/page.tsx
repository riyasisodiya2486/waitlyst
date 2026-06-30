export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { getDbClient } from '@/lib/db'

export default async function PublicCampaignsPage() {
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
        COALESCE(MAX(p.referral_count), 0)::int AS top_referrals
      FROM campaigns c
      LEFT JOIN participants p ON p.campaign_id = c.id
      WHERE c.status = 'live'
      GROUP BY c.id, c.title, c.slug, c.description, c.status, c.created_at
      ORDER BY c.created_at DESC`
    )

    const campaigns = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      status: row.status,
      signups: Number(row.signups || 0),
      topReferrals: Number(row.top_referrals || 0),
    }))

    return (
      <main className="min-h-screen bg-[#080808] text-[#F0EDE6]">
        <Navigation />

        <section className="px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pt-32">
          <div className="mx-auto max-w-[1140px]">
            <div className="max-w-[720px]">
              <div className="dm-mono text-[12px] uppercase tracking-wide text-[#5C5955]">Public campaigns</div>
              <h1 className="instrument-serif mt-4 text-[34px] leading-tight sm:text-[48px]">Browse live waitlists and join instantly.</h1>
              <p className="mt-4 text-[15px] leading-relaxed text-[#8A8782] sm:text-[16px]">
                Every campaign below has a public waitlist page. Visitors can open one, sign up, and get a referral link without founder login.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {!campaigns.length ? (
                <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6 text-[14px] text-[#8A8782]">
                  No campaigns are available yet.
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex h-full flex-col rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="dm-mono text-[16px] font-medium text-[#F0EDE6]">{campaign.title}</h2>
                      <span className="rounded border border-[rgba(200,241,53,0.2)] bg-[rgba(200,241,53,0.08)] px-2 py-1 text-[11px] uppercase tracking-wide text-[#C8F135]">
                        {campaign.status}
                      </span>
                    </div>
                    <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#8A8782]">
                      {campaign.description || 'Join the waitlist and move up the leaderboard with referrals.'}
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-[12px] text-[#5C5955]">
                      <span>{campaign.signups} signups</span>
                      <span>{campaign.topReferrals} top referrals</span>
                    </div>
                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.06)] pt-4">
                      <span className="dm-mono truncate text-[12px] text-[#8A8782]">/w/{campaign.slug}</span>
                      <Link href={`/w/${campaign.slug}`} className="dm-mono rounded bg-[#C8F135] px-4 py-2 text-[12px] font-medium text-[#080808] transition-all duration-150 hover:bg-[#d4f55a]">
                        Open campaign
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    )
  } finally {
    await client.end()
  }
}
