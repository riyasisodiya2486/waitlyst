export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'
import { FraudMonitorClient } from '@/components/fraud-monitor-client'

export default async function FraudMonitorPage() {
  const session = await getSession()
  const client = await getDbClient()

  try {
    const campaignsResult = await client.query('SELECT id, title FROM campaigns WHERE founder_id = $1 ORDER BY created_at DESC', [session?.founderId])
    const campaigns = campaignsResult.rows.map((row: any) => ({ id: row.id, name: row.title }))
    const initialCampaignId = campaigns[0]?.id || ''

    let fraudItems: Array<{ email: string; ip: string; referrals: number; riskScore: number; reason: string }> = []

    if (initialCampaignId) {
      const flaggedResult = await client.query(
        `SELECT email, ip_address, referral_count, fraud_score, fraud_status
         FROM participants
         WHERE campaign_id = $1 AND fraud_status IN ('flagged', 'suspicious')
         ORDER BY fraud_score DESC, referral_count DESC, rank ASC`,
        [initialCampaignId]
      )

      fraudItems = flaggedResult.rows.map((row: any) => ({
        email: row.email,
        ip: row.ip_address || 'unknown',
        referrals: Number(row.referral_count || 0),
        riskScore: Number(row.fraud_score || 0),
        reason:
          row.fraud_status === 'flagged'
            ? 'Previously flagged in the participant record for demo review.'
            : 'Previously marked suspicious in the participant record for demo review.',
      }))
    }

    return <FraudMonitorClient initialCampaigns={campaigns} initialCampaignId={initialCampaignId} initialFraudItems={fraudItems} />
  } finally {
    await client.end()
  }
}

