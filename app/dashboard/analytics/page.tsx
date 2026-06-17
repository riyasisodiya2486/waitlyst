'use client'

import { motion } from 'framer-motion'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navigation } from '@/components/navigation'
import { CustomCursor } from '@/components/custom-cursor'

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

export default function Analytics() {
  return (
    <main className="relative bg-[#080808] text-[#F0EDE6] min-h-screen">
      <CustomCursor />
      <Navigation />
      <DashboardSidebar />

      <div className="ml-14 pt-20 px-8">
        <motion.div
          className="max-w-[1200px]"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.h1 className="instrument-serif text-[32px] text-[#F0EDE6] mb-8" variants={itemVariants}>
            Analytics
          </motion.h1>

          <motion.div
            className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-12 text-center"
            variants={itemVariants}
          >
            <p className="text-[15px] text-[#8A8782]">Detailed analytics dashboard coming soon</p>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
