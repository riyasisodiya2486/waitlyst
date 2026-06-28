'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navigation } from '@/components/navigation'
import { fetchCampaigns, suggestRewardTiers } from '@/lib/api-client'

type Campaign = {
  id: string
  name: string
  slug: string
  signups: number
  referralRate: number
  status: string
  created: string
}

type RewardTier = {
  minReferrals: number
  rewardLabel: string
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([])
  const [suggesting, setSuggesting] = useState(false)

  async function loadCampaigns() {
    try {
      setLoading(true)
      setError('')
      const data = await fetchCampaigns()
      setCampaigns(data)
    } catch (err) {
      console.error('[v0] Failed to fetch campaigns:', err)
      setError('Could not load campaigns.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function handleSuggestTiers() {
    if (!description.trim()) return

    try {
      setSuggesting(true)
      const response = await suggestRewardTiers(description)
      setRewardTiers(response.tiers || [])
    } catch (err) {
      console.error('[v0] Failed to suggest tiers:', err)
      setRewardTiers([])
    } finally {
      setSuggesting(false)
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setSaving(true)
      setError('')
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          rewardTiers,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.message || 'Failed to create campaign')
      }

      setTitle('')
      setDescription('')
      setRewardTiers([])
      setShowForm(false)
      await loadCampaigns()
    } catch (err) {
      console.error('[v0] Failed to create campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  const totalSignups = campaigns.reduce((sum, campaign) => sum + (campaign.signups || 0), 0)
  const avgReferralRate = campaigns.length > 0 ? Math.round(campaigns.reduce((sum, campaign) => sum + (campaign.referralRate || 0), 0) / campaigns.length) : 0

  return (
    <main className="relative min-h-screen bg-[#080808] text-[#F0EDE6]">
      <Navigation />
      <DashboardSidebar />

      <div className="ml-14 px-8 pt-20">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="instrument-serif text-[32px]">Campaigns</h1>
              <p className="mt-2 text-[14px] text-[#8A8782]">Create a campaign, share the public link, and track real signups.</p>
            </div>
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="rounded bg-[#C8F135] px-4 py-3 text-[13px] font-medium text-[#080808]"
            >
              {showForm ? 'Close' : 'New campaign'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
              <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Total Signups</div>
              <div className="mt-2 dm-mono text-[36px] text-[#C8F135]">{totalSignups}</div>
            </div>
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
              <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Campaigns</div>
              <div className="mt-2 dm-mono text-[36px] text-[#C8F135]">{campaigns.length}</div>
            </div>
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
              <div className="dm-mono text-[12px] uppercase text-[#5C5955]">Avg Referral Rate</div>
              <div className="mt-2 dm-mono text-[36px] text-[#C8F135]">{avgReferralRate}%</div>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleCreateCampaign} className="space-y-4 rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[13px] text-[#8A8782]">Campaign title</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded border border-[rgba(255,255,255,0.1)] bg-[#080808] px-4 py-3 text-[14px] outline-none"
                    placeholder="Waitlyst Pro Launch"
                    required
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleSuggestTiers}
                    disabled={!description.trim() || suggesting}
                    className="rounded border border-[rgba(200,241,53,0.35)] px-4 py-3 text-[13px] text-[#C8F135] disabled:opacity-50"
                  >
                    {suggesting ? 'Suggesting...' : 'Suggest reward tiers'}
                  </button>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-[13px] text-[#8A8782]">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-28 w-full rounded border border-[rgba(255,255,255,0.1)] bg-[#080808] px-4 py-3 text-[14px] outline-none"
                  placeholder="Describe what people are joining for."
                />
              </label>

              {rewardTiers.length > 0 && (
                <div className="rounded border border-[rgba(255,255,255,0.06)] bg-[#080808] p-4">
                  <div className="mb-3 text-[13px] text-[#8A8782]">Suggested tiers</div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {rewardTiers.map((tier) => (
                      <div key={`${tier.minReferrals}-${tier.rewardLabel}`} className="rounded border border-[rgba(255,255,255,0.06)] p-3">
                        <div className="dm-mono text-[14px] text-[#C8F135]">{tier.minReferrals} referrals</div>
                        <div className="mt-1 text-[13px] text-[#F0EDE6]">{tier.rewardLabel}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="rounded bg-[#C8F135] px-4 py-3 text-[13px] font-medium text-[#080808] disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create campaign'}
                </button>
                <span className="text-[12px] text-[#5C5955]">Reward tiers are optional. Campaign creation will still work without them.</span>
              </div>
            </form>
          )}

          {error && <div className="rounded border border-[rgba(232,97,106,0.35)] bg-[rgba(232,97,106,0.08)] px-4 py-3 text-[13px] text-[#E8616A]">{error}</div>}

          <div className="overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-[12px] uppercase text-[#5C5955]">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Signups</th>
                    <th className="px-6 py-4">Referral Rate</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && campaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-[14px] text-[#8A8782]">
                        No campaigns yet. Create one to start testing the public signup flow.
                      </td>
                    </tr>
                  )}
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-[rgba(255,255,255,0.04)] text-[13px]">
                      <td className="px-6 py-4 text-[#F0EDE6]">{campaign.name}</td>
                      <td className="px-6 py-4 dm-mono text-[#8A8782]">{campaign.slug}</td>
                      <td className="px-6 py-4 dm-mono text-[#F0EDE6]">{campaign.signups}</td>
                      <td className="px-6 py-4 dm-mono text-[#C8F135]">{campaign.referralRate}%</td>
                      <td className="px-6 py-4 text-[#8A8782]">{campaign.status}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-4">
                          <Link href={`/dashboard/campaigns/${campaign.slug}`} className="text-[#C8F135]">View</Link>
                          <Link href={`/w/${campaign.slug}`} className="text-[#8A8782]">Public page</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
