'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-8 bg-[rgba(8,8,8,0.75)] backdrop-blur-lg"
      style={{
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
      transition={{ duration: 0.3 }}
    >
      <Link href="/" className="flex items-center gap-2 interactive">
        <div className="w-1 h-1 bg-[#C8F135]" />
        <span className="dm-mono text-[15px] text-[#F0EDE6] font-medium tracking-tighter">
          Waitlyst
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {['Product', 'Pricing', 'Docs'].map((item) => (
          <motion.a
            key={item}
            href="#"
            className="dm-mono text-[13px] text-[#8A8782] hover:text-[#F0EDE6] transition-colors duration-150"
            whileHover={{ y: -1 }}
          >
            {item}
          </motion.a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <motion.a
          href="#"
          className="dm-mono text-[13px] text-[#F0EDE6] hover:text-[#8A8782] px-4 py-2 transition-colors duration-150 interactive"
          whileHover={{ opacity: 0.8 }}
        >
          Sign in
        </motion.a>
        <motion.button
          className="dm-mono text-[13px] font-medium text-[#080808] bg-[#C8F135] hover:bg-[#d4f55a] px-[18px] py-[9px] rounded transition-all duration-150 interactive"
          whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(200,241,53,0.3)' }}
        >
          Get started →
        </motion.button>
      </div>
    </motion.nav>
  )
}
