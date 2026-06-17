'use client'

import { signIn } from 'next-auth/react'
import { useEffect } from 'react'

export default function LoginPage() {
  useEffect(() => {
    // Auto-redirect to Google OAuth on page load
    signIn('google', { redirect: true, callbackUrl: '/dashboard' })
  }, [])

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-[#F0EDE6] text-4xl mb-4">Signing you in...</h1>
        <p className="text-[#8A8782]">Redirecting to Google OAuth</p>
      </div>
    </div>
  )
}
