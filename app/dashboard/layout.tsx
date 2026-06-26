import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Dashboard - Waitlyst',
  description: 'Manage your waitlist campaigns',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return <>{children}</>
}
