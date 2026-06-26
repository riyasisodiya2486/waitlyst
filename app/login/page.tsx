'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Invalid email or password')
        return
      }

      window.location.href = '/dashboard'
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative bg-[#080808] text-[#F0EDE6] min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="instrument-serif text-[44px] italic text-[#F0EDE6] mb-2">Welcome back</h1>
          <p className="text-[15px] text-[#8A8782]">Sign in to your Waitlyst account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder="Email address"
              required
              className="w-full px-4 py-3 bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] focus:border-[#C8F135] focus:outline-none rounded text-[#F0EDE6] placeholder-[#5C5955] transition-all duration-150 dm-mono text-[13px]"
            />
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Password"
                required
                minLength={8}
                className="w-full px-4 py-3 bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] focus:border-[#C8F135] focus:outline-none rounded text-[#F0EDE6] placeholder-[#5C5955] transition-all duration-150 dm-mono text-[13px] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8782] hover:text-[#F0EDE6] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[rgba(245,101,101,0.08)] border border-[#F56565] rounded p-3">
              <p className="text-[12px] text-[#F56565]">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#C8F135] text-[#080808] font-medium rounded hover:bg-[#d4f55a] disabled:opacity-50 transition-all duration-150 dm-mono text-[13px]"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[13px] text-[#8A8782]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#F0EDE6] hover:text-[#C8F135] transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
