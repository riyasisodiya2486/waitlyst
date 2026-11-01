import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'
import { analyzeFraud } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const campaignId = body.campaignId || body.campaign_id

    if (!campaignId) {
      return NextResponse.json({ message: 'campaignId is required' }, { status: 400 })
    }

    const client = await getDbClient()

    try {
      const campaignCheck = await client.query('SELECT id FROM campaigns WHERE id = $1 AND founder_id = $2', [campaignId, session.founderId])

      if (campaignCheck.rows.length === 0) {
        await client.end()
        return NextResponse.json({ message: 'Campaign not found' }, { status: 404 })
      }

      const participantSnapshot = await client.query(
        `SELECT id, email, ip_address, referral_count, referred_by, fraud_score, fraud_status, created_at
         FROM participants
         WHERE campaign_id = $1
         ORDER BY created_at ASC, rank ASC`,
        [campaignId]
      )

      let events: any[] = participantSnapshot.rows.map((row: any) => ({
        participant_id: row.id,
        email: row.email,
        ip_address: row.ip_address,
        referral_count: Number(row.referral_count || 0),
        referred_by: row.referred_by,
        timestamp: new Date(row.created_at).getTime(),
        type: row.referred_by ? 'referral' : 'signup',
      }))

      let fraudAnalysis: any[] = []
      try {
        fraudAnalysis = await analyzeFraud(events)
      } catch (analysisError) {
        console.error('[v0] Failed to analyze fraud:', analysisError)
      }

      await client.query(
        `UPDATE participants
         SET fraud_score = 0, fraud_status = 'clean'
         WHERE campaign_id = $1`,
        [campaignId],
      )

      for (const result of fraudAnalysis) {
        const findResult = await client.query('SELECT id FROM participants WHERE campaign_id = $1 AND email = $2', [campaignId, result.email])

        if (findResult.rows.length > 0) {
          const participantId = findResult.rows[0].id
          const riskScore = Math.min(100, result.riskScore || 0)
          const status = riskScore > 75 ? 'flagged' : riskScore > 50 ? 'suspicious' : 'clean'

          await client.query('UPDATE participants SET fraud_score = $1, fraud_status = $2 WHERE id = $3', [riskScore, status, participantId])
        }
      }

      await client.end()

      return NextResponse.json({
        flagged: fraudAnalysis.length,
        results: fraudAnalysis,
      })
    } catch (dbError) {
      await client.end()
      throw dbError
    }
  } catch (error) {
    console.error('[v0] Fraud analysis error:', error)
    return NextResponse.json({ message: 'Fraud analysis failed' }, { status: 500 })
  }
}
