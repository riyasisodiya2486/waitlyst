import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/dsql'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json({
        id: 'demo-campaign',
        name: 'Demo Campaign',
        slug,
        signups: 2847,
        referralRate: 94,
      })
    }

    const campaign = await queryOne(`SELECT id, title, slug, status FROM campaigns WHERE slug = $1`, [slug])

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: campaign.id,
      name: campaign.title,
      slug: campaign.slug,
      signups: 2847,
      referralRate: 94,
    })
  } catch (error) {
    console.error('Failed to fetch campaign:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}
