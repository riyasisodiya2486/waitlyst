'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Settings, CreditCard, AlertCircle, LogOut } from 'lucide-react'

const navItems = [
  { label: 'Campaigns', href: '/dashboard', icon: BarChart3 },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Fraud', href: '/dashboard/fraud', icon: AlertCircle },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,10,0.97)] px-2 py-2 backdrop-blur md:hidden">
        <nav className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={`flex min-w-0 flex-col items-center gap-1 rounded px-1 py-2 text-[10px] ${isActive ? 'bg-[rgba(200,241,53,0.1)] text-[#F0EDE6]' : 'text-[#8A8782]'}`}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate dm-mono">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <aside className="fixed left-0 top-14 bottom-0 z-40 hidden w-14 border-r border-[rgba(255,255,255,0.06)] bg-[#0A0A0A] px-3 py-8 md:flex md:flex-col lg:w-[200px] lg:px-4">
        <div className="mb-12 flex justify-center lg:justify-start">
          <span className="dm-mono text-[18px] font-medium text-[#C8F135]">W</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 rounded px-3 py-3 transition-all duration-200 ${isActive ? 'border-l-2 border-l-[#C8F135] bg-[rgba(200,241,53,0.1)] text-[#F0EDE6]' : 'text-[#8A8782] hover:text-[#F0EDE6]'}`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="hidden whitespace-nowrap text-[13px] lg:inline">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="space-y-2 border-t border-[rgba(255,255,255,0.06)] pt-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded px-3 py-3 text-[#8A8782] transition-colors duration-200 hover:text-[#F56565]">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="hidden whitespace-nowrap text-[13px] lg:inline">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
