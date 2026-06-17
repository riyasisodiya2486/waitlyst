'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)

  const springConfig = { stiffness: 200, damping: 22 }
  const ringX = useSpring(cursorX, springConfig)
  const ringY = useSpring(cursorY, springConfig)

  useEffect(() => {
    // Check if touch device
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    setIsTouchDevice(isTouch)
    if (isTouch) return

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true)
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      ringX.set(e.clientX)
      ringY.set(e.clientY)
    }

    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => setIsVisible(false)

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.classList.contains('interactive') ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }

    const handleMouseOut = () => setIsHovering(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseenter', handleMouseEnter)
    window.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseenter', handleMouseEnter)
      window.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
    }
  }, [cursorX, cursorY, ringX, ringY])

  if (isTouchDevice) return null

  return (
    <>
      {isVisible && (
        <>
          {/* Inner dot */}
          <motion.div
            className="pointer-events-none fixed z-50 flex items-center justify-center"
            style={{
              left: cursorX,
              top: cursorY,
              x: '-50%',
              y: '-50%',
            }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[#C8F135]" />
          </motion.div>

          {/* Outer ring */}
          <motion.div
            className="pointer-events-none fixed z-40 rounded-full border"
            style={{
              left: ringX,
              top: ringY,
              x: '-50%',
              y: '-50%',
              width: isHovering ? 50.4 : 28,
              height: isHovering ? 50.4 : 28,
              borderColor: 'rgba(200, 241, 53, 0.35)',
              backgroundColor: isHovering ? 'rgba(200, 241, 53, 0.06)' : 'transparent',
            }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}
    </>
  )
}
