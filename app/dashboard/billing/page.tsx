'use client'

import { motion } from 'framer-motion'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navigation } from '@/components/navigation'
import { CustomCursor } from '@/components/custom-cursor'
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
}: {
  name: string
  price: string
  features: { text: string; included: boolean }[]
  isPro?: boolean
  isCurrent?: boolean
}) {
  return (
    <motion.div
      className={`relative bg-[#0F0F0F] rounded-[12px] p-8 ${
        isPro
          ? 'border-2 border-[#C8F135]'
          : 'border border-[rgba(255,255,255,0.06)]'
      }`}
      variants={itemVariants}
    >
      {isPro && (
        <motion.div
          className="absolute top-4 right-4 bg-[rgba(200,241,53,0.15)] border border-[rgba(200,241,53,0.3)] px-3 py-1 rounded"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="dm-mono text-[11px] uppercase text-[#C8F135] font-medium">Most popular</span>
        </motion.div>
      )}

      {isCurrent && !isPro && (
        <motion.div
          className="absolute top-4 right-4 bg-[rgba(111,207,151,0.15)] border border-[rgba(111,207,151,0.3)] px-3 py-1 rounded"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="dm-mono text-[11px] uppercase text-[#6FCF97] font-medium">Current plan</span>
        </motion.div>
      )}

      <h3 className="dm-mono text-[16px] font-medium text-[#F0EDE6] mb-2">{name}</h3>

      <div className="mb-8">
        <span className="dm-mono text-[36px] font-medium text-[#F0EDE6]">{price}</span>
        {price !== 'Free' && <span className="text-[13px] text-[#8A8782]">/month</span>}
      </div>

      <button
        className={`w-full py-3 rounded font-medium text-[13px] mb-8 transition-all duration-200 dm-mono ${
          isCurrent
            ? 'bg-[rgba(200,241,53,0.1)] border border-[#C8F135] text-[#C8F135]'
            : isPro
              ? 'bg-[#C8F135] text-[#080808] hover:bg-[#d4f55a]'
              : 'bg-[rgba(255,255,255,0.06)] text-[#F0EDE6] hover:bg-[rgba(255,255,255,0.1)]'
        }`}
      >
        {isCurrent ? 'Current Plan' : isPro ? 'Upgrade to Pro' : 'Downgrade'}
      </button>

      <div className="space-y-3">
        {featureList.map((feature, idx) => (
          <motion.div
            key={idx}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 + 0.2 }}
          >
            {feature.included ? (
              <CheckCircle2 className="w-5 h-5 text-[#6FCF97] flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-[#5C5955] flex-shrink-0" />
            )}
            <span
              className={`text-[13px] ${
                feature.included ? 'text-[#F0EDE6]' : 'text-[#5C5955]'
              }`}
            >
              {feature.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Billing() {
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
          <motion.h1 className="instrument-serif text-[32px] text-[#F0EDE6] mb-12" variants={itemVariants}>
            Billing
          </motion.h1>

          {/* Plans Grid */}
          <motion.div
            className="grid grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <PlanCard
              name="Free"
              price="Free"
              features={features.free}
              isCurrent={true}
            />
            <PlanCard
              name="Pro"
              price="$29"
              features={features.pro}
              isPro={true}
            />
          </motion.div>

          {/* Billing History */}
          <motion.div
            className="mt-16 bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-8"
            variants={itemVariants}
          >
            <h2 className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide mb-6">
              Billing History
            </h2>

            <div className="space-y-4">
              {[
                { date: '2024-02-01', amount: '$0.00', status: 'Free Plan' },
                { date: '2024-01-01', amount: '$0.00', status: 'Free Plan' },
              ].map((invoice, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center justify-between py-4 border-b border-[rgba(255,255,255,0.04)] last:border-b-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div>
                    <p className="text-[13px] text-[#F0EDE6]">{invoice.date}</p>
                    <p className="text-[12px] text-[#8A8782]">{invoice.status}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="dm-mono text-[13px] text-[#F0EDE6]">{invoice.amount}</span>
                    <button className="text-[12px] text-[#C8F135] hover:text-[#d4f55a] transition-colors">
                      Download
                    </button>
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
