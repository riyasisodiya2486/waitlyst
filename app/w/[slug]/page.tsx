'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from '@/components/navigation'
import { HeroBackground } from '@/components/hero-background'
import { mockLeaderboardData } from '@/lib/mock-data'
import { Copy, CheckCircle2 } from 'lucide-react'

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

function CountUpNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let current = 0
    const increment = Math.ceil(target / 60)
    const interval = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(interval)
      }
      setCount(current)
    }, 20)

    return () => clearInterval(interval)
  }, [target])

  return <span>{count}</span>
}

export default function WaitlistPage() {
  const [hasSignedUp, setHasSignedUp] = useState(false)
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const mockRank = 247

  const handleSignUp = () => {
    if (email.trim()) {
      setHasSignedUp(true)
    }
  }

  const handleCopyReferral = () => {
    navigator.clipboard.writeText('https://waitlyst.app/ref/demo-launch-abc123')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="relative bg-[#080808] text-[#F0EDE6] min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 px-8 overflow-hidden">
        <HeroBackground />

        <motion.div
          className="relative max-w-[480px] text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="wait">
            {!hasSignedUp ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              >
                <motion.h1
                  className="instrument-serif text-[64px] text-[#F0EDE6] mb-6 leading-tight"
                  variants={itemVariants}
                >
                  Acme Launch
                </motion.h1>

                <motion.p
                  className="text-[17px] text-[#8A8782] leading-relaxed mb-8"
                  variants={itemVariants}
                >
                  Join the waitlist for the most anticipated product launch of the year. Get early access and exclusive
                  benefits.
                </motion.p>

                <motion.div className="space-y-4 mb-8" variants={itemVariants}>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] focus:border-[#C8F135] focus:outline-none focus:ring-1 focus:ring-[rgba(200,241,53,0.1)] rounded text-[#F0EDE6] placeholder-[#5C5955] transition-all duration-150"
                    />
                    <button
                      onClick={handleSignUp}
                      className="dm-mono text-[13px] font-medium text-[#080808] bg-[#C8F135] hover:bg-[#d4f55a] px-[18px] py-3 rounded transition-all duration-150 interactive whitespace-nowrap"
                    >
                      Join →
                    </button>
                  </div>
                </motion.div>

                {/* Reward Tiers */}
                <motion.div className="space-y-3" variants={itemVariants}>
                  <div className="text-[12px] text-[#5C5955] dm-mono uppercase tracking-wide mb-4">Unlock rewards</div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { tier: 'Top 10', reward: 'Lifetime free' },
                      { tier: 'Top 50', reward: '6 months free' },
                      { tier: 'Top 200', reward: '1 month free' },
                    ].map((item) => (
                      <div
                        key={item.tier}
                        className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-3"
                      >
                        <div className="dm-mono text-[12px] font-medium text-[#C8F135] mb-1">{item.tier}</div>
                        <div className="text-[12px] text-[#8A8782]">{item.reward}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                className="space-y-8"
              >
                <div>
                  <p className="text-[18px] text-[#8A8782] mb-4">You&apos;re in!</p>
                  <motion.div
                    className="dm-mono font-medium text-[#C8F135]"
                    style={{ fontSize: 96 }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 18 }}
                  >
                    <CountUpNumber target={mockRank} />
                  </motion.div>
                </div>

                <motion.p className="text-[15px] text-[#8A8782]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  Share your link to move up
                </motion.p>

                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] rounded px-3 py-2">
                    <input
                      type="text"
                      readOnly
                      value="https://waitlyst.app/ref/demo-launch-abc123"
                      className="flex-1 bg-transparent text-[12px] dm-mono text-[#8A8782] outline-none"
                    />
                    <button
                      onClick={handleCopyReferral}
                      className="p-1 hover:text-[#C8F135] transition-colors interactive"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-[#6FCF97]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <motion.p
                      className="text-[12px] text-[#6FCF97] dm-mono"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Copied to clipboard
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-[13px] text-[#8A8782]">
                    <span className="text-[#F0EDE6] font-medium">Your referrals: 0</span>
                  </p>
                  <p className="text-[12px] text-[#5C5955] mt-2">Refer 3 friends to unlock 1 month free</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Leaderboard */}
      <section className="relative py-32 px-8 bg-[#080808]">
        <div className="max-w-[1140px] mx-auto">
          <motion.h2
            className="instrument-serif text-[44px] text-[#F0EDE6] mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Top Referrers
          </motion.h2>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.05 }}
          >
            {mockLeaderboardData.map((entry) => (
              <motion.div
                key={entry.rank}
                className={`flex items-center justify-between p-4 bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded ${
                  entry.rank === 1 ? 'border-l-2 border-l-[#C8F135]' : ''
                }`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              >
                <span className="dm-mono font-medium text-[16px] text-[#5C5955] w-12">#{entry.rank}</span>
                <span className="text-[13px] text-[#8A8782] flex-1">
                  {entry.email.replace(/(.{2}).*(@.*)/, '$1***$2')}
                </span>
                <span className="dm-mono text-[13px] bg-[rgba(200,241,53,0.08)] text-[#C8F135] px-3 py-1 rounded">
                  +{entry.referrals}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  )
}
