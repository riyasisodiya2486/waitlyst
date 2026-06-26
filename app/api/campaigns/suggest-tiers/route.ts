import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { suggestRewardTiers } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { description } = body

    if (!description) {
      return NextResponse.json({ message: 'description is required' }, { status: 400 })
    }

    const tiers = await suggestRewardTiers(description)

    return NextResponse.json({
      tiers: tiers.map((tier) => ({
        minReferrals: tier.min_referrals,
        rewardLabel: tier.reward_label,
      })),
    })
  } catch (error) {
    console.error('[v0] Reward tier suggestion error:', error)
    return NextResponse.json({ message: 'Failed to suggest reward tiers' }, { status: 500 })
  }
}
