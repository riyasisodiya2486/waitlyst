'use client'

import { useMemo, useState } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { HeroBackground } from '@/components/hero-background'
import { signupToWaitlist } from '@/lib/api-client'
import { obfuscateEmail } from '@/lib/mock-data'

type Campaign = {
  id: string
  title?: string
  name: string
  slug: string
  description?: string
  rewardTiers?: { minReferrals: number; rewardLabel: string }[]
}

type LeaderboardEntry = {
  id?: string
  email: string
  rank: number
  referral_count?: number
}

export function WaitlistPageClient({
  initialCampaign,
  initialLeaderboard,
  referralCodeFromUrl,
}: {
  initialCampaign: Campaign
  initialLeaderboard: LeaderboardEntry[]
  referralCodeFromUrl?: string
}) {
  const [campaign] = useState(initialCampaign)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ rank: number; referralCode: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const referralLink = useMemo(() => {
    if (!success || typeof window === 'undefined') return ''
    return `${window.location.origin}/w/${campaign.slug}?ref=${success.referralCode}`
  }, [success, campaign.slug])

  async function refreshLeaderboard() {
    const response = await fetch(`/api/leaderboard/${campaign.id}`)
    if (!response.ok) throw new Error('Failed to refresh leaderboard')
    const data = await response.json()
    setLeaderboard(data)
  }

  async function handleSignUp() {
    if (!email.trim()) return

    try {
      setSubmitting(true)
      setError('')
      const response = await signupToWaitlist(campaign.id, email.trim(), referralCodeFromUrl)
      setSuccess(response)
      await refreshLeaderboard()
    } catch (err) {
      console.error('[v0] Waitlist signup failed:', err)
      setError('Could not join the waitlist right now.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopyReferral() {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const rewardTiers = campaign.rewardTiers || []

  return (
    <main className="relative min-h-screen bg-[#080808] text-[#F0EDE6]">
      <Navigation />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-8 pt-32">
        <HeroBackground />
        <div className="relative w-full max-w-[520px] rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(15,15,15,0.88)] p-8 backdrop-blur">
          {!success ? (
            <div className="space-y-6">
              <div>
                <h1 className="instrument-serif text-[48px] leading-tight">{campaign.title || campaign.name}</h1>
                <p className="mt-4 text-[16px] leading-relaxed text-[#8A8782]">{campaign.description || 'Join the waitlist and move up by referring friends.'}</p>
                {referralCodeFromUrl && <p className="mt-3 text-[12px] text-[#C8F135]">Referral applied: {referralCodeFromUrl}</p>}
              </div>

              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                  placeholder="Enter your email"
                  className="flex-1 rounded border border-[rgba(255,255,255,0.1)] bg-[#080808] px-4 py-3 text-[14px] outline-none"
                />
                <button onClick={handleSignUp} disabled={submitting} className="rounded bg-[#C8F135] px-4 py-3 text-[13px] font-medium text-[#080808] disabled:opacity-50">
                  {submitting ? 'Joining...' : 'Join'}
                </button>
              </div>

              {error && <div className="rounded border border-[rgba(232,97,106,0.35)] bg-[rgba(232,97,106,0.08)] px-4 py-3 text-[13px] text-[#E8616A]">{error}</div>}

              {rewardTiers.length > 0 && (
                <div>
                  <div className="mb-3 text-[12px] uppercase tracking-wide text-[#5C5955]">Unlock rewards</div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {rewardTiers.map((tier) => (
                      <div key={`${tier.minReferrals}-${tier.rewardLabel}`} className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#080808] p-3">
                        <div className="dm-mono text-[12px] text-[#C8F135]">{tier.minReferrals} referrals</div>
                        <div className="mt-1 text-[12px] text-[#8A8782]">{tier.rewardLabel}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div>
                <p className="text-[18px] text-[#8A8782]">You're in.</p>
                <div className="mt-4 dm-mono text-[82px] text-[#C8F135]">{success.rank}</div>
                <p className="text-[14px] text-[#8A8782]">Share your link to move up the leaderboard.</p>
              </div>

              <div className="flex items-center gap-2 rounded border border-[rgba(255,255,255,0.1)] bg-[#080808] px-3 py-2">
                <input readOnly value={referralLink} className="flex-1 bg-transparent text-[12px] text-[#8A8782] outline-none" />
                <button onClick={handleCopyReferral} className="text-[#C8F135]">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#080808] p-4 text-left">
                <p className="text-[13px] text-[#F0EDE6]">Your referral code: {success.referralCode}</p>
                <p className="mt-2 text-[12px] text-[#5C5955]">Referral count updates on refresh.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="px-8 pb-24">
        <div className="mx-auto max-w-[960px]">
          <h2 className="instrument-serif text-[36px]">Top Referrers</h2>
          <div className="mt-8 space-y-2">
            {!leaderboard.length && <p className="text-[14px] text-[#8A8782]">No signups yet.</p>}
            {leaderboard.map((entry) => (
              <div key={`${entry.email}-${entry.rank}`} className="flex items-center justify-between rounded border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-4">
                <span className="dm-mono w-12 text-[#5C5955]">#{entry.rank}</span>
                <span className="flex-1 text-[13px] text-[#8A8782]">{obfuscateEmail(entry.email)}</span>
                <span className="dm-mono rounded bg-[rgba(200,241,53,0.08)] px-3 py-1 text-[13px] text-[#C8F135]">+{entry.referral_count || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
