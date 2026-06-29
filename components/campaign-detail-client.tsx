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

      <div className="px-4 pb-28 pt-20 md:ml-14 md:px-6 md:pb-8 lg:ml-[200px] lg:px-8">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="instrument-serif text-[28px] sm:text-[32px]">{campaign.title || campaign.name || 'Campaign'}</h1>
              <p className="mt-2 text-[14px] text-[#8A8782]">Status: {campaign.status || 'draft'}</p>
            </div>
            <button onClick={handleCopyLink} className="flex w-full items-center justify-center gap-2 rounded border border-[rgba(255,255,255,0.1)] px-4 py-3 text-[13px] text-[#C8F135] sm:w-auto">
              <Copy className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy public link'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
              <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Total Signups</div>
              <div className="mt-2 dm-mono text-[32px] text-[#C8F135] sm:text-[36px]">{campaign.signups || 0}</div>
            </div>
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
              <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Referral Rate</div>
              <div className="mt-2 dm-mono text-[32px] text-[#C8F135] sm:text-[36px]">{campaign.referralRate || 0}%</div>
            </div>
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6 md:col-span-2">
              <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Public URL</div>
              <div className="mt-2 break-all text-[14px] text-[#8A8782]">{publicLink || `/w/${campaign.slug}`}</div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F]">
            <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-4 sm:px-6">
              <h2 className="dm-mono text-[12px] uppercase text-[#5C5955]">Leaderboard</h2>
            </div>
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {!leaderboard.length && <div className="px-4 py-6 text-[14px] text-[#8A8782] sm:px-6">No leaderboard entries yet.</div>}
              {leaderboard.map((entry) => (
                <div key={`${entry.email}-${entry.rank}`} className="flex flex-col gap-3 px-4 py-4 text-[13px] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="dm-mono w-8 text-[#5C5955]">#{entry.rank}</span>
                    <span className="truncate">{entry.email}</span>
                  </div>
                  <span className="dm-mono self-start rounded bg-[rgba(200,241,53,0.08)] px-3 py-1 text-[#C8F135] sm:self-auto">+{entry.referral_count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
