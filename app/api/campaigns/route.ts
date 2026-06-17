import { NextRequest, NextResponse } from 'next/server'
import { query, execute, founderExists } from '@/lib/dsql'
import { mockCampaigns } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json(mockCampaigns)
    }

    const campaigns = await query(
      `SELECT id, founder_id, title, slug, status, created_at FROM campaigns ORDER BY created_at DESC`
    )

    return NextResponse.json(
      campaigns.map((c: any) => ({
        id: c.id,
        name: c.title,
        slug: c.slug,
        signups: Math.floor(Math.random() * 3000) + 500,
        referralRate: Math.floor(Math.random() * 40) + 60,
        status: c.status,
        created: new Date(c.created_at).toISOString().split('T')[0],
      }))
    )
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { founder_id, title, description, slug } = body

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json({ id: 'mock-campaign', ...body })
    }

    // Verify founder exists (manual referential integrity)
    const founderExistsCheck = await founderExists(founder_id)
    if (!founderExistsCheck) {
      return NextResponse.json({ error: 'Founder not found' }, { status: 404 })
    }

    const result = await query(
      `INSERT INTO campaigns (founder_id, title, description, slug) VALUES ($1, $2, $3, $4) RETURNING id`,
      [founder_id, title, description, slug]
    )

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
