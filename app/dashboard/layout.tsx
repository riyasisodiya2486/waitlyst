import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Waitlyst',
  description: 'Manage your waitlist campaigns',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
