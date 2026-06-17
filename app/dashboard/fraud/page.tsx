'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navigation } from '@/components/navigation'
import { CustomCursor } from '@/components/custom-cursor'
import { mockFraudItems } from '@/lib/mock-data'
import { fetchFraud, isDemo } from '@/lib/api-client'
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react'

function CircularProgress({ percentage, color }: { percentage: number; color: string }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width="50" height="50" viewBox="0 0 50 50" className="transform -rotate-90">
      <circle cx="25" cy="25" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      <motion.circle
        cx="25"
        cy="25"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        strokeLinecap="round"
      />
      <text
        x="25"
        y="25"
        textAnchor="middle"
        dominantBaseline="middle"
        className="dm-mono text-[12px] font-medium fill-[#F0EDE6]"
      >
        {percentage}
      </text>
    </svg>
  )
}

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  React.useEffect(() => {
    if (isComplete) return

    let index = 0
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, index))
      index++
      if (index > text.length) {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, 15)

    return () => clearInterval(interval)
  }, [text, isComplete])

  return <span>{displayedText}</span>
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

export default function FraudMonitor() {
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [fraudItems, setFraudItems] = useState(mockFraudItems)

  useEffect(() => {
    if (!isDemo()) {
      fetchFraud('demo-campaign')
        .then(setFraudItems)
        .catch((err) => {
          console.error('[v0] Failed to fetch fraud data:', err)
          setFraudItems(mockFraudItems)
        })
    }
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const highRiskCount = fraudItems.filter((item) => item.riskScore > 70).length

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
          <motion.h1 className="instrument-serif text-[32px] text-[#F0EDE6] mb-8" variants={itemVariants}>
            Fraud Monitor
          </motion.h1>

          {/* Alert Banner */}
          {highRiskCount > 0 && (
            <motion.div
              className="bg-[rgba(232,97,106,0.08)] border border-[rgba(232,97,106,0.2)] rounded-[12px] p-4 mb-8 flex items-center gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
            >
              <AlertTriangle className="w-5 h-5 text-[#E8616A] flex-shrink-0" />
              <span className="text-[13px] text-[#E8616A]">
                {highRiskCount} high-risk {highRiskCount === 1 ? 'signup' : 'signups'} detected in the last hour
              </span>
            </motion.div>
          )}

          {/* Risk Distribution */}
          <motion.div className="grid grid-cols-3 gap-4 mb-12" variants={containerVariants} initial="hidden" animate="visible">
            {[
              { label: 'Clean', count: 2800, color: '#6FCF97' },
              { label: 'Review', count: 47, color: '#E8B339' },
              { label: 'Flagged', count: 3, color: '#E8616A' },
            ].map((item) => (
              <motion.div
                key={item.label}
                className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-6"
                variants={itemVariants}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium">{item.label}</span>
                </div>
                <div className="dm-mono text-[28px] font-medium text-[#F0EDE6]">{item.count}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Flagged Participants Table */}
          <motion.div
            className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] overflow-hidden"
            variants={itemVariants}
          >
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide">
                Flagged Participants
              </h2>
            </div>

            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {fraudItems.map((item, idx) => {
                const isExpanded = expandedIds.includes(`fraud-${idx}`)
                const riskColor =
                  item.riskScore > 70 ? '#E8616A' : item.riskScore > 50 ? '#E8B339' : '#6FCF97'

                return (
                  <motion.div key={idx} className="px-6 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-[13px] text-[#F0EDE6]">{item.email}</span>
                        <span className="dm-mono text-[12px] text-[#8A8782]">{item.ip}</span>
                        <span className="dm-mono text-[12px] text-[#8A8782]">+{item.referrals}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <CircularProgress percentage={item.riskScore} color={riskColor} />
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <motion.div
                      className="mb-4 p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded text-[12px] text-[#8A8782]"
                      initial={false}
                      animate={{ height: isExpanded ? 'auto' : '24px', overflow: 'hidden' }}
                    >
                      {isExpanded ? (
                        <TypewriterText text={item.reason} />
                      ) : (
                        <span className="truncate">{item.reason}</span>
                      )}
                    </motion.div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(`fraud-${idx}`)}
                        className="text-[12px] text-[#C8F135] hover:text-[#d4f55a] transition-colors"
                      >
                        {isExpanded ? 'Hide' : 'Expand'}
                      </button>
                      <button className="flex items-center gap-1 text-[12px] px-3 py-1.5 border border-[rgba(111,207,151,0.3)] text-[#6FCF97] hover:bg-[rgba(111,207,151,0.1)] rounded transition-colors">
                        <CheckCircle2 className="w-3 h-3" />
                        Approve
                      </button>
                      <button className="flex items-center gap-1 text-[12px] px-3 py-1.5 border border-[rgba(232,97,106,0.3)] text-[#E8616A] hover:bg-[rgba(232,97,106,0.1)] rounded transition-colors">
                        <AlertCircle className="w-3 h-3" />
                        Quarantine
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}

import React from 'react'
