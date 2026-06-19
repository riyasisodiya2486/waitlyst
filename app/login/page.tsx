'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-[#F0EDE6] text-4xl mb-4 instrument-serif">Sign in to Waitlyst</h1>
          <p className="text-[#8A8782]">Access your dashboard and manage campaigns</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => signIn('google', { redirect: true, callbackUrl: '/dashboard' })}
            className="w-full py-3 px-4 bg-[#C8F135] text-[#080808] font-medium rounded hover:bg-[#d4f55a] transition-colors duration-150 dm-mono text-sm"
          >
            Continue with Google
          </button>

          <p className="text-xs text-[#5C5955] text-center mt-6">
            By signing in, you create your Waitlyst account and accept our terms of service.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-[#8A8782] hover:text-[#F0EDE6] transition-colors text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
