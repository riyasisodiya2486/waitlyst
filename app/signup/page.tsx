'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters'
    return ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handlePasswordBlur = () => {
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'

    if (formData.email && !formData.email.includes('@')) newErrors.email = 'Invalid email format'
    if (formData.password && formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        setErrors({ submit: error.message || 'Sign up failed' })
        return
      }

      setSuccess(true)
      setTimeout(() => (window.location.href = '/dashboard'), 1500)
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative bg-[#080808] text-[#F0EDE6] min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="instrument-serif text-[44px] italic text-[#F0EDE6] mb-2">Create your account</h1>
          <p className="text-[15px] text-[#8A8782]">Join Waitlyst and launch your waitlist</p>
        </div>

        {success ? (
          <div className="bg-[rgba(111,207,151,0.08)] border border-[#6FCF97] rounded-[12px] p-6 text-center">
            <p className="text-[15px] text-[#6FCF97] mb-2">Account created successfully!</p>
            <p className="text-[13px] text-[#8A8782]">Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] focus:border-[#C8F135] focus:outline-none rounded text-[#F0EDE6] placeholder-[#5C5955] transition-all duration-150 dm-mono text-[13px]"
              />
              {errors.name && <p className="text-[12px] text-[#F56565] mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                className="w-full px-4 py-3 bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] focus:border-[#C8F135] focus:outline-none rounded text-[#F0EDE6] placeholder-[#5C5955] transition-all duration-150 dm-mono text-[13px]"
              />
              {errors.email && <p className="text-[12px] text-[#F56565] mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handlePasswordBlur}
                  placeholder="Password (min 8 characters)"
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
              {errors.password && <p className="text-[12px] text-[#F56565] mt-1">{errors.password}</p>}
              {formData.password && (
                <p className="text-[12px] text-[#8A8782] mt-1">✓ Password strength requirements met</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handlePasswordBlur}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] focus:border-[#C8F135] focus:outline-none rounded text-[#F0EDE6] placeholder-[#5C5955] transition-all duration-150 dm-mono text-[13px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8782] hover:text-[#F0EDE6] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[12px] text-[#F56565] mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-[rgba(245,101,101,0.08)] border border-[#F56565] rounded p-3">
                <p className="text-[12px] text-[#F56565]">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#C8F135] text-[#080808] font-medium rounded hover:bg-[#d4f55a] disabled:opacity-50 transition-all duration-150 dm-mono text-[13px]"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-[13px] text-[#8A8782]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#F0EDE6] hover:text-[#C8F135] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
