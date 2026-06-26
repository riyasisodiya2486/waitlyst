'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart3, Settings, CreditCard, AlertCircle, LogOut } from 'lucide-react'

const navItems = [
  { label: 'Campaigns', href: '/dashboard', icon: BarChart3 },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Fraud Monitor', href: '/dashboard/fraud', icon: AlertCircle },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <motion.aside
      className="fixed left-0 top-14 bottom-0 bg-[#0A0A0A] border-r border-[rgba(255,255,255,0.06)] z-40 flex flex-col py-8 px-4"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      animate={{ width: isExpanded ? 200 : 56 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-12 flex justify-center">
        <span className="dm-mono text-[18px] font-medium text-[#C8F135]">W</span>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`flex items-center gap-3 px-3 py-3 rounded transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[rgba(200,241,53,0.1)] border-l-2 border-l-[#C8F135] text-[#F0EDE6]'
                    : 'text-[#8A8782] hover:text-[#F0EDE6]'
                }`}
                whileHover={{ x: 4 }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <motion.span
                  className="text-[13px] whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isExpanded ? 1 : 0 }}
                  transition={{ delay: isExpanded ? 0.1 : 0 }}
                >
                  {item.label}
                </motion.span>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <motion.div className="space-y-2 pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded text-[#8A8782] hover:text-[#F56565] transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <motion.span
            className="text-[13px] whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ delay: isExpanded ? 0.1 : 0 }}
          >
            Sign out
          </motion.span>
        </button>
      </motion.div>
    </motion.aside>
  )
}
