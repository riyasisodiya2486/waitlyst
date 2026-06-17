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
            className="w-full py-3 px-4 bg-[#C8F135] text-[#080808] font-medium rounded hover:bg-[#d4f55a] transition-colors duration-150 dm-mono"
          >
            Sign in with Google
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#080808] text-[#5C5955] dm-mono">or</span>
            </div>
          </div>

          <div className="text-center py-6 bg-[#0F0F0F] rounded border border-[rgba(255,255,255,0.06)] p-6">
            <p className="text-[#8A8782] text-sm mb-4">
              Demo mode is active. Configure Google OAuth credentials to enable sign-in:
            </p>
            <ol className="text-left text-xs text-[#5C5955] space-y-2 mb-4">
              <li>1. Go to Google Cloud Console</li>
              <li>2. Create OAuth 2.0 credentials</li>
              <li>3. Add http://localhost:3000/api/auth/callback/google to authorized redirects</li>
              <li>4. Update .env.development.local with credentials</li>
            </ol>
            <code className="text-[#C8F135] text-[11px] block bg-[#080808] p-3 rounded border border-[rgba(200,241,53,0.2)]">
              AUTH_GOOGLE_ID=your-id
              <br />
              AUTH_GOOGLE_SECRET=your-secret
            </code>
          </div>
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
