'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navigation } from '@/components/navigation'
import { mockMetrics, mockCampaigns } from '@/lib/mock-data'
import { fetchCampaigns, isDemo } from '@/lib/api-client'

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

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState(mockCampaigns)

  useEffect(() => {
    if (!isDemo()) {
      fetchCampaigns()
        .then(setCampaigns)
        .catch((err) => {
          console.error('[v0] Failed to fetch campaigns:', err)
          setCampaigns(mockCampaigns)
        })
    }
  }, [])
  return (
    <main className="relative bg-[#080808] text-[#F0EDE6] min-h-screen">
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
          <motion.div className="flex items-center justify-between mb-12" variants={itemVariants}>
            <h1 className="instrument-serif text-[32px] text-[#F0EDE6]">Campaigns</h1>
            <button className="dm-mono text-[13px] font-medium text-[#080808] bg-[#C8F135] hover:bg-[#d4f55a] px-[18px] py-3 rounded transition-all duration-150 interactive">
              New campaign
            </button>
          </motion.div>

          {/* Metrics */}
          <motion.div
            className="grid grid-cols-4 gap-4 mb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {mockMetrics.map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </motion.div>

          {/* Campaigns Table */}
          <motion.div
            className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] overflow-hidden"
            variants={itemVariants}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-6 py-4 text-left text-[12px] dm-mono uppercase text-[#5C5955] font-medium">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-[12px] dm-mono uppercase text-[#5C5955] font-medium">
                      Slug
                    </th>
                    <th className="px-6 py-4 text-left text-[12px] dm-mono uppercase text-[#5C5955] font-medium">
                      Signups
                    </th>
                    <th className="px-6 py-4 text-left text-[12px] dm-mono uppercase text-[#5C5955] font-medium">
                      Referral Rate
                    </th>
                    <th className="px-6 py-4 text-left text-[12px] dm-mono uppercase text-[#5C5955] font-medium">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-[12px] dm-mono uppercase text-[#5C5955] font-medium">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-[12px] dm-mono uppercase text-[#5C5955] font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <motion.tr
                      key={campaign.id}
                      className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-6 py-4 text-[13px] text-[#F0EDE6]">{campaign.name}</td>
                      <td className="px-6 py-4 text-[13px] dm-mono text-[#8A8782]">{campaign.slug}</td>
                      <td className="px-6 py-4 text-[13px] dm-mono text-[#F0EDE6]">{campaign.signups}</td>
                      <td className="px-6 py-4 text-[13px] dm-mono text-[#C8F135]">{campaign.referralRate}%</td>
                      <td className="px-6 py-4 text-[13px]">
                        <span
                          className={`dm-mono text-[11px] uppercase font-medium px-2 py-1 rounded ${
                            campaign.status === 'live'
                              ? 'bg-[rgba(111,207,151,0.15)] text-[#6FCF97]'
                              : 'bg-[rgba(232,179,57,0.15)] text-[#E8B339]'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#8A8782]">{campaign.created}</td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/campaigns/${campaign.slug}`}>
                          <button className="text-[13px] text-[#C8F135] hover:text-[#d4f55a] transition-colors interactive">
                            View
                          </button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
