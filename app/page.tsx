'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navigation } from '@/components/navigation'
import { HeroBackground } from '@/components/hero-background'
import { CustomCursor } from '@/components/custom-cursor'
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
      className="relative h-full flex flex-col"
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
        className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-6 shadow-xl"
        style={{
          boxShadow: '0 50px 100px -20px rgba(0,0,0,0.6)',
          transform: 'rotate(-2deg)',
        }}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <span className="dm-mono text-[12px] text-[#5C5955]">waitlyst.app/w/demo-launch</span>
          <div className="flex items-center gap-2">
            <span className="pulse-dot" />
            <span className="dm-mono text-[11px] uppercase text-[#6FCF97] font-medium tracking-wide">
              Live
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {mockLeaderboardData.slice(0, 5).map((entry, idx) => (
            <motion.div
              key={entry.rank}
              className="flex items-center justify-between text-sm"
              animate={animatingRank === idx ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span
                className={`dm-mono font-medium text-[18px] ${
                  entry.rank === 1 ? 'text-[#C8F135]' : 'text-[#F0EDE6]'
                }`}
              >
                {entry.rank}
              </span>
              <span className="text-[#8A8782] text-[13px] flex-1 ml-4">
                {entry.email.replace(/(.{2}).*(@.*)/, '$1***$2')}
              </span>
              <span className="dm-mono text-[12px] bg-[rgba(200,241,53,0.08)] text-[#C8F135] px-2 py-1 rounded">
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
    <div className="border-y border-[rgba(255,255,255,0.06)] py-6 flex justify-center items-center gap-8 text-center">
      <div>
        <span className="dm-mono text-[13px] text-[#5C5955]">
          <span className="text-[#F0EDE6] font-medium">{counts[0]}</span> founders
        </span>
      </div>
      <span className="text-[#5C5955]">·</span>
      <div>
        <span className="dm-mono text-[13px] text-[#5C5955]">
          <span className="text-[#F0EDE6] font-medium">{counts[1]}</span> signups
        </span>
      </div>
      <span className="text-[#5C5955]">·</span>
      <div>
        <span className="dm-mono text-[13px] text-[#5C5955]">
          <span className="text-[#F0EDE6] font-medium">{counts[2]}%</span> legitimacy
        </span>
      </div>
    </div>
  )
}

function FeatureCard({ feature, idx }: { feature: any; idx: number }) {
  return (
    <motion.div
      className={`${feature.span} bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-7 hover:border-[rgba(200,241,53,0.25)] transition-all duration-300`}
      variants={itemVariants}
      whileHover={{
        boxShadow: '0 0 24px rgba(200,241,53,0.1)',
        borderColor: 'rgba(200,241,53,0.25)',
      }}
    >
      <h3 className="dm-mono text-[16px] font-medium text-[#F0EDE6] mb-2">{feature.title}</h3>
      <p className="text-[15px] text-[#8A8782] leading-relaxed">{feature.description}</p>

      {feature.title === 'AI Fraud Detection' && (
        <div className="mt-6 space-y-3">
          {[
            { label: 'Low Risk', width: '85%', color: '#6FCF97' },
            { label: 'Medium Risk', width: '45%', color: '#E8B339' },
            { label: 'High Risk', width: '20%', color: '#E8616A' },
          ].map((risk) => (
            <div key={risk.label} className="flex items-center gap-3">
              <span className="text-[12px] text-[#5C5955] dm-mono w-20">{risk.label}</span>
              <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: risk.color }}
                  initial={{ width: 0 }}
                  animate={{ width: risk.width }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {feature.title === 'Real-time Analytics' && (
        <div className="mt-6 flex items-end gap-2 h-24">
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
      <CustomCursor />
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 px-8 overflow-hidden">
        <HeroBackground />

        <div className="relative max-w-[1140px] mx-auto grid grid-cols-2 gap-12 items-center min-h-[calc(100vh-128px)]">
          <motion.div
            className="col-span-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow */}
            <motion.div className="flex items-center gap-2 mb-8" variants={itemVariants}>
              <span className="pulse-dot" />
              <span className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide">
                2,847 founders already building
              </span>
            </motion.div>

            {/* Headline */}
            <div className="mb-8 leading-tight">
              <motion.h1 className="instrument-serif text-[76px] text-[#F0EDE6] mb-2" variants={itemVariants}>
                Launch viral.
              </motion.h1>
              <motion.h1
                className="instrument-serif text-[76px] text-[#C8F135] mb-2"
                variants={itemVariants}
              >
                Grow fast.
              </motion.h1>
              <motion.h1 className="instrument-serif text-[76px] text-[#F0EDE6]" variants={itemVariants}>
                Ship when ready.
              </motion.h1>
            </div>

            {/* Subheading */}
            <motion.p
              className="text-[17px] text-[#8A8782] leading-relaxed max-w-[440px] mb-8"
              variants={itemVariants}
            >
              The waitlist platform built for indie makers. Viral referrals, AI fraud detection, real-time
              leaderboards — live in minutes.
            </motion.p>

            {/* Email Form */}
            <motion.div className="flex gap-3" variants={itemVariants}>
              <input
                type="email"
                placeholder="Try it — enter your email"
                className="w-[440px] px-4 py-3 bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] focus:border-[#C8F135] focus:outline-none focus:ring-1 focus:ring-[rgba(200,241,53,0.1)] rounded text-[#F0EDE6] placeholder-[#5C5955] transition-all duration-150"
              />
              <button className="dm-mono text-[13px] font-medium text-[#080808] bg-[#C8F135] hover:bg-[#d4f55a] px-[18px] py-3 rounded transition-all duration-150 whitespace-nowrap interactive">
                Join waitlist →
              </button>
            </motion.div>
          </motion.div>

          {/* Live Preview Card */}
          <div className="col-span-1">
            <LivePreviewCard />
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="relative bg-[#080808]">
        <div className="max-w-[1140px] mx-auto">
          <SocialProofBar />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-8 bg-[#080808]">
        <div className="max-w-[1140px] mx-auto">
          <motion.div
            className="mb-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.span className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide">
              What you get
            </motion.span>
            <motion.h2
              className="instrument-serif text-[44px] text-[#F0EDE6] mt-4 leading-tight"
              variants={itemVariants}
            >
              Everything a founder needs.
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {mockFeatures.map((feature, idx) => (
              <FeatureCard key={idx} feature={feature} idx={idx} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080808] border-t border-[rgba(255,255,255,0.06)] py-12 px-8">
        <div className="max-w-[1140px] mx-auto">
          <div className="grid grid-cols-3 gap-12 mb-12">
            <div>
              <h4 className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide mb-4">
                Product
              </h4>
              <div className="space-y-2">
                {['Features', 'Pricing', 'API Docs'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-[13px] text-[#8A8782] hover:text-[#F0EDE6] transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide mb-4">
                Company
              </h4>
              <div className="space-y-2">
                {['About', 'Blog', 'Careers'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-[13px] text-[#8A8782] hover:text-[#F0EDE6] transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide mb-4">
                Legal
              </h4>
              <div className="space-y-2">
                {['Privacy', 'Terms', 'Status'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-[13px] text-[#8A8782] hover:text-[#F0EDE6] transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.06)] pt-8 flex items-center justify-between">
            <span className="dm-mono text-[12px] text-[#5C5955]">Waitlyst © 2024</span>
            <span className="dm-mono text-[12px] text-[#5C5955]">All rights reserved</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
