'use client'

import { useMemo, useState } from 'react'
import { Copy } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navigation } from '@/components/navigation'

type Campaign = {
  id: string
  title?: string
  name: string
  slug: string
  status: string
  signups: number
  referralRate: number
}

type LeaderboardEntry = {
  email: string
  rank: number
  referral_count?: number
}

export function CampaignDetailClient({ initialCampaign, initialLeaderboard }: { initialCampaign: Campaign; initialLeaderboard: LeaderboardEntry[] }) {
  const [campaign] = useState(initialCampaign)
  const [leaderboard] = useState(initialLeaderboard)
  const [copied, setCopied] = useState(false)

  const publicLink = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/w/${campaign.slug}`
  }, [campaign.slug])

  function handleCopyLink() {
    if (!publicLink) return
    navigator.clipboard.writeText(publicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="relative min-h-screen bg-[#080808] text-[#F0EDE6]">
      <Navigation />
      <DashboardSidebar />

      <div className="ml-14 px-8 pt-20">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="instrument-serif text-[32px]">{campaign.title || campaign.name || 'Campaign'}</h1>
              <p className="mt-2 text-[14px] text-[#8A8782]">Status: {campaign.status || 'draft'}</p>
            </div>
            <button onClick={handleCopyLink} className="flex items-center gap-2 rounded border border-[rgba(255,255,255,0.1)] px-4 py-3 text-[13px] text-[#C8F135]">
              <Copy className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy public link'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
              <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Total Signups</div>
              <div className="mt-2 dm-mono text-[36px] text-[#C8F135]">{campaign.signups || 0}</div>
            </div>
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
              <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Referral Rate</div>
              <div className="mt-2 dm-mono text-[36px] text-[#C8F135]">{campaign.referralRate || 0}%</div>
            </div>
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6 md:col-span-2">
              <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Public URL</div>
              <div className="mt-2 break-all text-[14px] text-[#8A8782]">{publicLink || `/w/${campaign.slug}`}</div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F]">
            <div className="border-b border-[rgba(255,255,255,0.06)] px-6 py-4">
              <h2 className="dm-mono text-[12px] uppercase text-[#5C5955]">Leaderboard</h2>
            </div>
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {!leaderboard.length && <div className="px-6 py-6 text-[14px] text-[#8A8782]">No leaderboard entries yet.</div>}
              {leaderboard.map((entry) => (
                <div key={`${entry.email}-${entry.rank}`} className="flex items-center justify-between px-6 py-4 text-[13px]">
                  <div className="flex items-center gap-4">
                    <span className="dm-mono w-8 text-[#5C5955]">#{entry.rank}</span>
                    <span>{entry.email}</span>
                  </div>
                  <span className="dm-mono rounded bg-[rgba(200,241,53,0.08)] px-3 py-1 text-[#C8F135]">+{entry.referral_count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
