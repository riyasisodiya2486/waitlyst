import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const { campaignId } = params

    const client = await getDbClient()

    try {
      const result = await client.query(
        'SELECT id, email, rank, referral_count FROM participants WHERE campaign_id = $1 ORDER BY rank ASC LIMIT 50',
        [campaignId]
      )

      await client.end()

      return NextResponse.json(result.rows)
    } catch (dbError) {
      await client.end()
      throw dbError
    }
  } catch (error) {
    console.error('[v0] Leaderboard fetch error:', error)
    return NextResponse.json({ message: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
