import type { Metadata, Viewport } from 'next'
import './globals.css'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="auto">
      <body className="bg-[#080808] text-[#F0EDE6] antialiased">{children}</body>
    </html>
  )
}
