import { NextRequest, NextResponse } from 'next/server'
import { suggestRewardTiers } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { description } = body

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json([
        { min_referrals: 10, reward_label: 'Top 10', tier_order: 1 },
        { min_referrals: 50, reward_label: 'Top 50', tier_order: 2 },
        { min_referrals: 200, reward_label: 'Top 200', tier_order: 3 },
      ])
    }

    const suggestions = await suggestRewardTiers(description)
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Failed to suggest tiers:', error)
    return NextResponse.json({ error: 'Failed to suggest tiers' }, { status: 500 })
  }
}
