// @ts-nocheck
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navigation } from '@/components/navigation'
import { createCheckoutSession, isDemo } from '@/lib/api-client'
import { CheckCircle2, Circle } from 'lucide-react'

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

const features = {
  free: [
    { text: 'Up to 500 signups', included: true },
    { text: 'Basic analytics', included: true },
    { text: 'AI fraud detection', included: false },
    { text: 'Referral rewards', included: false },
    { text: 'API access', included: false },
    { text: 'Priority support', included: false },
  ],
  pro: [
    { text: 'Unlimited signups', included: true },
    { text: 'Advanced analytics', included: true },
    { text: 'AI fraud detection', included: true },
    { text: 'Referral rewards', included: true },
    { text: 'API access', included: true },
    { text: 'Priority support', included: true },
  ],
}

function PlanCard({
  name,
  price,
  features: featureList,
  isPro = false,
  isCurrent = false,
  isLoading = false,
  onUpgrade,
}: {
  name: string
  price: string
  features: { text: string; included: boolean }[]
  isPro?: boolean
  isCurrent?: boolean
  isLoading?: boolean
  onUpgrade?: () => void
}) {
  return (
    <motion.div className={`relative rounded-[12px] bg-[#0F0F0F] p-6 sm:p-8 ${isPro ? 'border-2 border-[#C8F135]' : 'border border-[rgba(255,255,255,0.06)]'}`} variants={itemVariants}>
      {isPro && (
        <motion.div className="absolute right-4 top-4 rounded border border-[rgba(200,241,53,0.3)] bg-[rgba(200,241,53,0.15)] px-3 py-1" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <span className="dm-mono text-[11px] font-medium uppercase text-[#C8F135]">Most popular</span>
        </motion.div>
      )}

      {isCurrent && !isPro && (
        <motion.div className="absolute right-4 top-4 rounded border border-[rgba(111,207,151,0.3)] bg-[rgba(111,207,151,0.15)] px-3 py-1" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <span className="dm-mono text-[11px] font-medium uppercase text-[#6FCF97]">Current plan</span>
        </motion.div>
      )}

      <h3 className="dm-mono mb-2 text-[16px] font-medium text-[#F0EDE6]">{name}</h3>

      <div className="mb-8">
        <span className="dm-mono text-[32px] font-medium text-[#F0EDE6] sm:text-[36px]">{price}</span>
        {price !== 'Free' && <span className="text-[13px] text-[#8A8782]">/month</span>}
      </div>

      <button
        onClick={isPro && !isCurrent ? onUpgrade : undefined}
        disabled={isCurrent || isLoading}
        className={`dm-mono mb-8 w-full rounded py-3 text-[13px] font-medium transition-all duration-200 ${isCurrent ? 'border border-[#C8F135] bg-[rgba(200,241,53,0.1)] text-[#C8F135]' : isPro ? 'bg-[#C8F135] text-[#080808] hover:bg-[#d4f55a] disabled:opacity-50' : 'bg-[rgba(255,255,255,0.06)] text-[#F0EDE6] hover:bg-[rgba(255,255,255,0.1)]'}`}
      >
        {isLoading ? 'Processing...' : isCurrent ? 'Current Plan' : isPro ? 'Upgrade to Pro' : 'Downgrade'}
      </button>

      <div className="space-y-3">
        {featureList.map((feature, idx) => (
          <motion.div key={idx} className="flex items-center gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 + 0.2 }}>
            {feature.included ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#6FCF97]" /> : <Circle className="h-5 w-5 flex-shrink-0 text-[#5C5955]" />}
            <span className={`text-[13px] ${feature.included ? 'text-[#F0EDE6]' : 'text-[#5C5955]'}`}>{feature.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Billing() {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    try {
      setIsLoading(true)
      if (isDemo()) {
        alert('Demo mode: Redirect to Stripe checkout in production')
        return
      }

      const response = await createCheckoutSession('founder-id', 'user@example.com', 'User Name', `${window.location.origin}/dashboard/billing?success=true`, window.location.href)

      if (response.url) {
        window.location.href = response.url
      }
    } catch (error) {
      console.error('[v0] Checkout error:', error)
      alert('Failed to start checkout')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-[#080808] text-[#F0EDE6]">
      <Navigation />
      <DashboardSidebar />

      <div className="px-4 pb-28 pt-20 md:ml-14 md:px-6 md:pb-8 lg:ml-[200px] lg:px-8">
        <motion.div className="mx-auto max-w-[1200px]" variants={containerVariants} initial="hidden" animate="visible">
          <motion.h1 className="instrument-serif mb-12 text-[28px] text-[#F0EDE6] sm:text-[32px]" variants={itemVariants}>
            Billing
          </motion.h1>

          <motion.div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8" variants={containerVariants} initial="hidden" animate="visible">
            <PlanCard name="Free" price="Free" features={features.free} isCurrent={true} isLoading={isLoading} />
            <PlanCard name="Pro" price="$29" features={features.pro} isPro={true} isLoading={isLoading} onUpgrade={handleCheckout} />
          </motion.div>

          <motion.div className="mt-12 rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6 sm:mt-16 sm:p-8" variants={itemVariants}>
            <h2 className="dm-mono mb-6 text-[12px] font-medium uppercase tracking-wide text-[#5C5955]">Billing History</h2>

            <div className="space-y-4">
              {[
                { date: '2024-02-01', amount: '$0.00', status: 'Free Plan' },
                { date: '2024-01-01', amount: '$0.00', status: 'Free Plan' },
              ].map((invoice, idx) => (
                <motion.div key={idx} className="flex flex-col gap-3 border-b border-[rgba(255,255,255,0.04)] py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.1 }}>
                  <div>
                    <p className="text-[13px] text-[#F0EDE6]">{invoice.date}</p>
                    <p className="text-[12px] text-[#8A8782]">{invoice.status}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="dm-mono text-[13px] text-[#F0EDE6]">{invoice.amount}</span>
                    <button className="text-[12px] text-[#C8F135] transition-colors hover:text-[#d4f55a]">Download</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
