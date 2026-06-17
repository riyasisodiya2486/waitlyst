'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navigation } from '@/components/navigation'
import { CustomCursor } from '@/components/custom-cursor'
import { mockLeaderboardData, mockRecentActivity } from '@/lib/mock-data'
import { Copy, CheckCircle2 } from 'lucide-react'

function CountUpMetric({ target }: { target: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let current = 0
    const increment = Math.ceil(target / 40)
    const interval = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(interval)
      }
      setCount(current)
    }, 25)

    return () => clearInterval(interval)
  }, [target])

  return <span>{count.toLocaleString()}</span>
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 18 }}
    >
      <div className="dm-mono font-medium text-[40px] text-[#C8F135] mb-2">
        <CountUpMetric target={value} />
      </div>
      <div className="text-[13px] text-[#8A8782]">{label}</div>
    </motion.div>
  )
}

export default function CampaignDetail() {
  const [copied, setCopied] = useState(false)
  const [recentEvents, setRecentEvents] = useState(mockRecentActivity)

  // Simulate new events
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = {
        type: Math.random() > 0.5 ? 'signup' : 'referral',
        email: `user${Math.floor(Math.random() * 1000)}@example.com`,
        referrals: Math.floor(Math.random() * 5) + 1,
        time: 'just now',
      }
      setRecentEvents((prev) => [newEvent, ...prev.slice(0, 4)])
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://waitlyst.app/w/acme-launch')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 18,
      },
    },
  }

  return (
    <main className="relative bg-[#080808] text-[#F0EDE6] min-h-screen">
      <CustomCursor />
      <Navigation />
      <DashboardSidebar />

      {/* Main Content */}
      <div className="ml-14 pt-20 px-8">
        <motion.div
          className="max-w-[1200px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div className="flex items-center justify-between mb-8" variants={itemVariants}>
            <div className="flex items-center gap-4">
              <h1 className="instrument-serif text-[32px] text-[#F0EDE6]">Acme Launch</h1>
              <div className="flex items-center gap-2 bg-[rgba(111,207,151,0.15)] px-3 py-1.5 rounded">
                <span className="pulse-dot" />
                <span className="dm-mono text-[11px] uppercase text-[#6FCF97] font-medium">Live</span>
              </div>
            </div>
            <motion.button
              onClick={handleCopyLink}
              className="flex items-center gap-2 dm-mono text-[13px] text-[#C8F135] hover:text-[#d4f55a] transition-colors interactive"
              whileHover={{ x: 4 }}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy link
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Metrics */}
          <motion.div
            className="grid grid-cols-4 gap-4 mb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { label: 'Total Signups', value: 2847 },
              { label: 'Referrals', value: 1203 },
              { label: 'Referral Rate', value: 94 },
              { label: 'Avg Referrals', value: 18 },
            ].map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </motion.div>

          {/* Two Column Layout */}
          <motion.div className="grid grid-cols-3 gap-8" variants={itemVariants}>
            {/* Leaderboard */}
            <div className="col-span-2">
              <motion.div
                className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h2 className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide">
                    Leaderboard
                  </h2>
                </div>

                <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {mockLeaderboardData.slice(0, 8).map((entry) => (
                    <motion.div
                      key={entry.rank}
                      className="px-6 py-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="dm-mono font-medium text-[14px] text-[#5C5955] w-8">#{entry.rank}</span>
                        <span className="text-[13px] text-[#F0EDE6]">{entry.email}</span>
                      </div>
                      <span className="dm-mono text-[13px] bg-[rgba(200,241,53,0.08)] text-[#C8F135] px-3 py-1 rounded">
                        +{entry.referrals}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <div className="col-span-1">
              <motion.div
                className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] overflow-hidden sticky top-24"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h2 className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide">
                    Recent Activity
                  </h2>
                </div>

                <div className="divide-y divide-[rgba(255,255,255,0.04)] max-h-96 overflow-y-auto">
                  {recentEvents.map((event, idx) => (
                    <motion.div
                      key={idx}
                      className="px-6 py-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      {event.type === 'signup' ? (
                        <>
                          <p className="text-[12px] text-[#F0EDE6]">New signup</p>
                          <p className="text-[12px] text-[#8A8782] mt-1">{event.email}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[12px] text-[#F0EDE6]">Referral activity</p>
                          <p className="text-[12px] text-[#8A8782] mt-1">+{event.referrals} referrals</p>
                        </>
                      )}
                      <p className="text-[11px] text-[#5C5955] mt-2">{event.time}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
