'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navigation } from '@/components/navigation'

type Campaign = {
  id: string
  name: string
}

type FraudItem = {
  email: string
  ip: string
  referrals: number
  riskScore: number
  reason: string
}

function FraudMetricSkeleton() {
  return (
    <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6 animate-pulse">
      <div className="h-3 w-20 rounded bg-[rgba(255,255,255,0.08)]" />
      <div className="mt-4 h-10 w-16 rounded bg-[rgba(255,255,255,0.08)]" />
    </div>
  )
}

export function FraudMonitorClient({
  initialCampaigns,
  initialCampaignId,
  initialFraudItems,
}: {
  initialCampaigns: Campaign[]
  initialCampaignId: string
  initialFraudItems: FraudItem[]
}) {
  const [campaigns] = useState<Campaign[]>(initialCampaigns)
  const [campaignId, setCampaignId] = useState(initialCampaignId)
  const [fraudItems, setFraudItems] = useState<FraudItem[]>(initialFraudItems)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadFraud(targetCampaignId?: string) {
    const activeCampaignId = targetCampaignId || campaignId
    if (!activeCampaignId) return

    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/fraud/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: activeCampaignId }),
      })
      if (!response.ok) throw new Error('Failed to fetch fraud data')
      const json = await response.json()
      setFraudItems(json.results || [])
    } catch (err) {
      console.error('[v0] Failed to fetch fraud data:', err)
      setError('Fraud analysis is using fallback data right now.')
    } finally {
      setLoading(false)
    }
  }

  const highRiskCount = fraudItems.filter((item) => item.riskScore > 70).length

  return (
    <main className="relative min-h-screen bg-[#080808] text-[#F0EDE6]">
      <Navigation />
      <DashboardSidebar />

      <div className="ml-14 px-8 pt-20">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="instrument-serif text-[32px]">Fraud Monitor</h1>
              <p className="mt-2 text-[14px] text-[#8A8782]">Runs Claude when available and falls back cleanly when it is not.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={campaignId}
                onChange={(e) => {
                  const value = e.target.value
                  setCampaignId(value)
                  loadFraud(value)
                }}
                className="rounded border border-[rgba(255,255,255,0.1)] bg-[#0F0F0F] px-3 py-2 text-[13px]"
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <button onClick={() => loadFraud()} className="rounded bg-[#C8F135] px-4 py-3 text-[13px] font-medium text-[#080808]">
                {loading ? 'Running...' : 'Re-run analysis'}
              </button>
            </div>
          </div>

          {highRiskCount > 0 && <div className="rounded border border-[rgba(232,97,106,0.35)] bg-[rgba(232,97,106,0.08)] px-4 py-3 text-[13px] text-[#E8616A]">{highRiskCount} high-risk signups detected.</div>}
          {error && <div className="rounded border border-[rgba(232,179,57,0.35)] bg-[rgba(232,179,57,0.08)] px-4 py-3 text-[13px] text-[#E8B339]">{error}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {loading ? (
              <>
                <FraudMetricSkeleton />
                <FraudMetricSkeleton />
                <FraudMetricSkeleton />
              </>
            ) : (
              <>
                <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
                  <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Flagged</div>
                  <div className="mt-2 dm-mono text-[36px] text-[#E8616A]">{fraudItems.filter((item) => item.riskScore > 75).length}</div>
                </div>
                <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
                  <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Review</div>
                  <div className="mt-2 dm-mono text-[36px] text-[#E8B339]">{fraudItems.filter((item) => item.riskScore > 50 && item.riskScore <= 75).length}</div>
                </div>
                <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
                  <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Results</div>
                  <div className="mt-2 dm-mono text-[36px] text-[#C8F135]">{fraudItems.length}</div>
                </div>
              </>
            )}
          </div>

          <div className="overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F]">
            <div className="border-b border-[rgba(255,255,255,0.06)] px-6 py-4">
              <h2 className="dm-mono text-[12px] uppercase text-[#5C5955]">Analysis Results</h2>
            </div>
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {loading ? (
                Array.from({ length: Math.max(fraudItems.length || 0, 2) }).map((_, index) => (
                  <div key={index} className="space-y-3 px-6 py-4 animate-pulse">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="h-4 w-48 rounded bg-[rgba(255,255,255,0.08)]" />
                        <div className="h-4 w-24 rounded bg-[rgba(255,255,255,0.08)]" />
                      </div>
                      <div className="h-4 w-20 rounded bg-[rgba(200,241,53,0.12)]" />
                    </div>
                    <div className="h-4 w-3/4 rounded bg-[rgba(255,255,255,0.08)]" />
                    <div className="h-4 w-28 rounded bg-[rgba(255,255,255,0.08)]" />
                  </div>
                ))
              ) : !fraudItems.length ? (
                <div className="px-6 py-6 text-[14px] text-[#8A8782]">No suspicious activity found.</div>
              ) : (
                fraudItems.map((item) => (
                  <div key={`${item.email}-${item.ip}`} className="space-y-3 px-6 py-4 text-[13px]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[#F0EDE6]">{item.email}</div>
                        <div className="mt-1 text-[#8A8782]">{item.ip}</div>
                      </div>
                      <div className="dm-mono text-[#C8F135]">Risk {item.riskScore}</div>
                    </div>
                    <div className="text-[#8A8782]">{item.reason}</div>
                    <div className="text-[#5C5955]">Referrals: {item.referrals}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
