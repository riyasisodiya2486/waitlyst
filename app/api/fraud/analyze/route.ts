import { NextRequest, NextResponse } from 'next/server'
import { getRecentEvents } from '@/lib/dynamo'
import { analyzeFraud } from '@/lib/claude'
import { mockFraudItems } from '@/lib/mock-data'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { campaign_id } = body

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json(mockFraudItems)
    }

    const events = await getRecentEvents(campaign_id, 24)
    const fraudResults = await analyzeFraud(events)

    return NextResponse.json(fraudResults)
  } catch (error) {
    console.error('Failed to analyze fraud:', error)
    return NextResponse.json({ error: 'Failed to analyze fraud' }, { status: 500 })
  }
}
