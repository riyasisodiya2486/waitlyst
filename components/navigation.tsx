'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionView } from '@/components/session-provider'

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const { founderId, founderName } = useSessionView()
  const isLoggedIn = !!founderId

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-[rgba(8,8,8,0.75)] px-8 backdrop-blur-lg"
      style={{
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
      transition={{ duration: 0.3 }}
    >
      <Link href="/" className="flex items-center gap-2 interactive">
        <div className="h-1 w-1 bg-[#C8F135]" />
        <span className="dm-mono text-[15px] font-medium tracking-tighter text-[#F0EDE6]">Waitlyst</span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        <Link href="/dashboard" className="dm-mono text-[13px] text-[#8A8782] transition-colors duration-150 hover:text-[#F0EDE6]">
          Product
        </Link>
        <a href="#" className="dm-mono text-[13px] text-[#8A8782] transition-colors duration-150 hover:text-[#F0EDE6]">
          Pricing
        </a>
        <a href="#" className="dm-mono text-[13px] text-[#8A8782] transition-colors duration-150 hover:text-[#F0EDE6]">
          Docs
        </a>
      </div>

      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <span className="dm-mono hidden text-[13px] text-[#8A8782] md:inline">{founderName || 'Founder'}</span>
            <Link href="/dashboard" className="dm-mono inline-block rounded bg-[#C8F135] px-[18px] py-[9px] text-[13px] font-medium text-[#080808] transition-all duration-150 hover:bg-[#d4f55a] interactive">
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="dm-mono px-4 py-2 text-[13px] text-[#F0EDE6] transition-colors duration-150 hover:text-[#8A8782] interactive">
              Sign in
            </Link>
            <Link href="/signup" className="dm-mono inline-block rounded bg-[#C8F135] px-[18px] py-[9px] text-[13px] font-medium text-[#080808] transition-all duration-150 hover:bg-[#d4f55a] interactive">
              Get started
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  )
}
