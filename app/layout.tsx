export const dynamic = 'force-dynamic'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { getSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'
import { SessionProvider } from '@/components/session-provider'

export const metadata: Metadata = {
  title: 'Waitlyst - Viral Waitlist Platform',
  description: 'Launch viral. Grow fast. Ship when ready. The waitlist platform built for indie makers.',
}

export const viewport: Viewport = {
  themeColor: '#080808',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  let founderName: string | null = null

  if (session?.founderId) {
    const client = await getDbClient()
    try {
      const result = await client.query('SELECT name FROM founders WHERE id = $1', [session.founderId])
      founderName = result.rows[0]?.name || null
    } catch (error) {
      console.error('[layout] Failed to load founder for navigation:', error)
    } finally {
      await client.end()
    }
  }

  return (
    <html suppressHydrationWarning lang="en" data-scroll-behavior="auto">
      <body suppressHydrationWarning className="bg-[#080808] text-[#F0EDE6] antialiased">
        <SessionProvider value={{ founderId: session?.founderId || null, founderName }}>{children}</SessionProvider>
      </body>
    </html>
  )
}
