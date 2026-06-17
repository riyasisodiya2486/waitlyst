import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/dsql'
import { mockLeaderboardData } from '@/lib/mock-data'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json(mockLeaderboardData)
    }

    const participants = await query(
      `SELECT rank, email, referral_count as referrals 
       FROM participants 
       WHERE campaign_id = $1 
       ORDER BY rank ASC 
       LIMIT 100`,
      [campaignId]
    )

    return NextResponse.json(
      participants.map((p: any, idx: number) => ({
        rank: p.rank || idx + 1,
        email: p.email,
        referrals: p.referrals || 0,
      }))
    )
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
