// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navigation } from '@/components/navigation'
import { HeroBackground } from '@/components/hero-background'
import { mockLeaderboardData, mockFeatures } from '@/lib/mock-data'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
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

function LivePreviewCard() {
  const [animatingRank, setAnimatingRank] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const randomRank = Math.floor(Math.random() * 5)
      setAnimatingRank(randomRank)
      setTimeout(() => setAnimatingRank(null), 600)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="relative flex h-full flex-col"
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 18,
        delay: 0.4,
      }}
    >
      <div
        className="rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[#0F0F0F] p-5 shadow-xl sm:p-6"
        style={{
          boxShadow: '0 50px 100px -20px rgba(0,0,0,0.6)',
          transform: 'rotate(-2deg)',
        }}
      >
        <div className="mb-6 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
          <span className="dm-mono text-[11px] text-[#5C5955] sm:text-[12px]">waitlyst.app/w/demo-launch</span>
          <div className="flex items-center gap-2">
            <span className="pulse-dot" />
            <span className="dm-mono text-[11px] font-medium uppercase tracking-wide text-[#6FCF97]">Live</span>
          </div>
        </div>

        <div className="space-y-3">
          {mockLeaderboardData.slice(0, 5).map((entry, idx) => (
            <motion.div
              key={entry.rank}
              className="flex items-center justify-between gap-3 text-sm"
              animate={animatingRank === idx ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className={`dm-mono text-[16px] font-medium sm:text-[18px] ${entry.rank === 1 ? 'text-[#C8F135]' : 'text-[#F0EDE6]'}`}>
                {entry.rank}
              </span>
              <span className="ml-1 flex-1 truncate text-[12px] text-[#8A8782] sm:ml-4 sm:text-[13px]">
                {entry.email.replace(/(.{2}).*(@.*)/, '$1***$2')}
              </span>
              <span className="dm-mono rounded bg-[rgba(200,241,53,0.08)] px-2 py-1 text-[11px] text-[#C8F135] sm:text-[12px]">
                +{entry.referrals}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function SocialProofBar() {
  const [counts, setCounts] = useState([0, 0, 0])

  useEffect(() => {
    const targets = [2847, 14293, 94]
    const intervals = targets.map((target, idx) => {
      let current = 0
      return setInterval(() => {
        current += Math.ceil(target / 50)
        if (current >= target) {
          current = target
          clearInterval(intervals[idx])
        }
        setCounts((prev) => {
          const newCounts = [...prev]
          newCounts[idx] = current
          return newCounts
        })
      }, 30)
    })

    return () => intervals.forEach((i) => clearInterval(i))
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-4 border-y border-[rgba(255,255,255,0.06)] py-6 text-center sm:flex-row sm:gap-8">
      <div>
        <span className="dm-mono text-[13px] text-[#5C5955]"><span className="font-medium text-[#F0EDE6]">{counts[0]}</span> founders</span>
      </div>
      <span className="hidden text-[#5C5955] sm:inline">Â·</span>
      <div>
        <span className="dm-mono text-[13px] text-[#5C5955]"><span className="font-medium text-[#F0EDE6]">{counts[1]}</span> signups</span>
      </div>
      <span className="hidden text-[#5C5955] sm:inline">Â·</span>
      <div>
        <span className="dm-mono text-[13px] text-[#5C5955]"><span className="font-medium text-[#F0EDE6]">{counts[2]}%</span> legitimacy</span>
      </div>
    </div>
  )
}

function FeatureCard({ feature }: { feature: any; idx: number }) {
  return (
    <motion.div
      className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-5 transition-all duration-300 hover:border-[rgba(200,241,53,0.25)] sm:p-7"
      variants={itemVariants}
      whileHover={{
        boxShadow: '0 0 24px rgba(200,241,53,0.1)',
        borderColor: 'rgba(200,241,53,0.25)',
      }}
    >
      <h3 className="dm-mono mb-2 text-[16px] font-medium text-[#F0EDE6]">{feature.title}</h3>
      <p className="text-[14px] leading-relaxed text-[#8A8782] sm:text-[15px]">{feature.description}</p>

      {feature.title === 'AI Fraud Detection' && (
        <div className="mt-6 space-y-3">
          {[
            { label: 'Low Risk', width: '85%', color: '#6FCF97' },
            { label: 'Medium Risk', width: '45%', color: '#E8B339' },
            { label: 'High Risk', width: '20%', color: '#E8616A' },
          ].map((risk) => (
            <div key={risk.label} className="flex items-center gap-3">
              <span className="dm-mono w-20 text-[12px] text-[#5C5955]">{risk.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <motion.div className="h-full" style={{ backgroundColor: risk.color }} initial={{ width: 0 }} animate={{ width: risk.width }} transition={{ duration: 1, delay: 0.5 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {feature.title === 'Real-time Analytics' && (
        <div className="mt-6 flex h-24 items-end gap-2">
          {[65, 45, 70, 55, 80, 60].map((height, idx) => (
            <motion.div
              key={idx}
              className={`flex-1 rounded-sm ${idx === 4 ? 'bg-[#C8F135]' : 'bg-[#5C5955]'}`}
              style={{ height: `${height}%` }}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.6, delay: idx * 0.1 + 0.5 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function Home() {
  return (
    <main className="relative bg-[#080808] text-[#F0EDE6]">
      <Navigation />

      <section className="relative min-h-screen overflow-hidden px-4 pt-24 sm:px-6 lg:px-8 lg:pt-32">
        <HeroBackground />

        <div className="relative mx-auto grid min-h-[calc(100vh-96px)] max-w-[1140px] grid-cols-1 items-center gap-10 lg:min-h-[calc(100vh-128px)] lg:grid-cols-2 lg:gap-12">
          <motion.div className="order-2 lg:order-1" variants={containerVariants} initial="hidden" animate="visible">
            <motion.div className="mb-6 flex items-center gap-2 sm:mb-8" variants={itemVariants}>
              <span className="pulse-dot" />
              <span className="dm-mono text-[11px] font-medium uppercase tracking-wide text-[#5C5955] sm:text-[12px]">2,847 founders already building</span>
            </motion.div>

            <div className="mb-6 leading-tight sm:mb-8">
              <motion.h1 className="instrument-serif mb-1 text-[44px] text-[#F0EDE6] sm:text-[58px] lg:text-[76px]" variants={itemVariants}>Launch viral.</motion.h1>
              <motion.h1 className="instrument-serif mb-1 text-[44px] text-[#C8F135] sm:text-[58px] lg:text-[76px]" variants={itemVariants}>Grow fast.</motion.h1>
              <motion.h1 className="instrument-serif text-[44px] text-[#F0EDE6] sm:text-[58px] lg:text-[76px]" variants={itemVariants}>Ship when ready.</motion.h1>
            </div>

            <motion.p className="mb-8 max-w-[520px] text-[15px] leading-relaxed text-[#8A8782] sm:text-[17px]" variants={itemVariants}>
              The waitlist platform built for indie makers. Viral referrals, AI fraud detection, real-time leaderboards live in minutes.
            </motion.p>

            <motion.div className="flex flex-col gap-3 sm:flex-row" variants={itemVariants}>
              <input
                type="email"
                placeholder="Try it - enter your email"
                className="w-full rounded border border-[rgba(255,255,255,0.1)] bg-[#0F0F0F] px-4 py-3 text-[#F0EDE6] placeholder-[#5C5955] transition-all duration-150 focus:border-[#C8F135] focus:outline-none focus:ring-1 focus:ring-[rgba(200,241,53,0.1)] sm:max-w-[440px]"
              />
              <button className="interactive whitespace-nowrap rounded bg-[#C8F135] px-[18px] py-3 text-[13px] font-medium text-[#080808] transition-all duration-150 hover:bg-[#d4f55a] dm-mono">
                Join waitlist -&gt;
              </button>
            </motion.div>
          </motion.div>

          <div className="order-1 lg:order-2">
            <LivePreviewCard />
          </div>
        </div>
      </section>

      <section className="relative bg-[#080808] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1140px]">
          <SocialProofBar />
        </div>
      </section>

      <section className="relative bg-[#080808] px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1140px]">
          <motion.div className="mb-12" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
            <motion.span className="dm-mono text-[12px] font-medium uppercase tracking-wide text-[#5C5955]">What you get</motion.span>
            <motion.h2 className="instrument-serif mt-4 text-[34px] leading-tight text-[#F0EDE6] sm:text-[44px]" variants={itemVariants}>
              Everything a founder needs.
            </motion.h2>
          </motion.div>

          <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
            {mockFeatures.map((feature, idx) => (
              <FeatureCard key={idx} feature={feature} idx={idx} />
            ))}
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#080808] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1140px]">
          <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            <div>
              <h4 className="dm-mono mb-4 text-[12px] font-medium uppercase tracking-wide text-[#5C5955]">Product</h4>
              <div className="space-y-2">
                {['Features', 'Pricing', 'API Docs'].map((link) => (
                  <a key={link} href="#" className="block text-[13px] text-[#8A8782] transition-colors hover:text-[#F0EDE6]">{link}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="dm-mono mb-4 text-[12px] font-medium uppercase tracking-wide text-[#5C5955]">Company</h4>
              <div className="space-y-2">
                {['About', 'Blog', 'Careers'].map((link) => (
                  <a key={link} href="#" className="block text-[13px] text-[#8A8782] transition-colors hover:text-[#F0EDE6]">{link}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="dm-mono mb-4 text-[12px] font-medium uppercase tracking-wide text-[#5C5955]">Legal</h4>
              <div className="space-y-2">
                {['Privacy', 'Terms', 'Status'].map((link) => (
                  <a key={link} href="#" className="block text-[13px] text-[#8A8782] transition-colors hover:text-[#F0EDE6]">{link}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[rgba(255,255,255,0.06)] pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <span className="dm-mono text-[12px] text-[#5C5955]">Waitlyst (c) 2026</span>
            <span className="dm-mono text-[12px] text-[#5C5955]">All rights reserved</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

