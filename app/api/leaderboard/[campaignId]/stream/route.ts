import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/dsql'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const response = new NextResponse(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: {"rank":1,"email":"test@example.com","referrals":42}\n\n')
            )
            const interval = setInterval(() => {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ rank: Math.random() * 100, email: 'test@test.com', referrals: Math.random() * 50 })}\n\n`
                )
              )
            }, 3000)

            setTimeout(() => {
              clearInterval(interval)
              controller.close()
            }, 30000)
          },
        })
      )

      response.headers.set('Content-Type', 'text/event-stream')
      response.headers.set('Cache-Control', 'no-cache')
      response.headers.set('Connection', 'keep-alive')
      return response
    }

    const response = new NextResponse(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()

          const sendUpdate = async () => {
            try {
              const participants = await query(
                `SELECT rank, email, referral_count as referrals 
                 FROM participants 
                 WHERE campaign_id = $1 
                 ORDER BY rank ASC 
                 LIMIT 5`,
                [campaignId]
              )

              const data = participants.map((p: any, idx: number) => ({
                rank: p.rank || idx + 1,
                email: p.email,
                referrals: p.referrals || 0,
              }))

              for (const item of data) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(item)}\n\n`))
              }
            } catch (error) {
              console.error('Stream error:', error)
            }
          }

          await sendUpdate()

          const interval = setInterval(sendUpdate, 3000)

          req.signal.addEventListener('abort', () => {
            clearInterval(interval)
            controller.close()
          })

          setTimeout(() => {
            clearInterval(interval)
            controller.close()
          }, 30000)
        },
      })
    )

    response.headers.set('Content-Type', 'text/event-stream')
    response.headers.set('Cache-Control', 'no-cache')
    response.headers.set('Connection', 'keep-alive')

    return response
  } catch (error) {
    console.error('Stream error:', error)
    return NextResponse.json({ error: 'Failed to stream leaderboard' }, { status: 500 })
  }
}
