export const isDemo = () => process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function fetchCampaigns() {
  const response = await fetch('/api/campaigns')
  if (!response.ok) throw new Error('Failed to fetch campaigns')
  return response.json()
}

export async function fetchCampaign(slug: string) {
  const response = await fetch(`/api/campaigns/${slug}`)
  if (!response.ok) throw new Error('Failed to fetch campaign')
  return response.json()
}

export async function fetchLeaderboard(campaignId: string) {
  const response = await fetch(`/api/leaderboard/${campaignId}`)
  if (!response.ok) throw new Error('Failed to fetch leaderboard')
  return response.json()
}

export async function fetchFraud(campaignId: string) {
  const response = await fetch('/api/fraud/analyze', {
    method: 'POST',
    body: JSON.stringify({ campaign_id: campaignId }),
  })
  if (!response.ok) throw new Error('Failed to fetch fraud data')
  return response.json()
}

export async function signupToWaitlist(
  campaignId: string,
  email: string,
  referredBy?: string
) {
  const response = await fetch('/api/signup', {
    method: 'POST',
    body: JSON.stringify({
      campaign_id: campaignId,
      email,
      referred_by: referredBy,
    }),
  })
  if (!response.ok) throw new Error('Failed to signup')
  return response.json()
}

export async function suggestRewardTiers(description: string) {
  const response = await fetch('/api/campaigns/suggest-tiers', {
    method: 'POST',
    body: JSON.stringify({ description }),
  })
  if (!response.ok) throw new Error('Failed to suggest tiers')
  return response.json()
}

export async function createCheckoutSession(
  founderid: string,
  email: string,
  name: string,
  successUrl: string,
  cancelUrl: string
) {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({
      founder_id: founderid,
      email,
      name,
      successUrl,
      cancelUrl,
    }),
  })
  if (!response.ok) throw new Error('Failed to create checkout session')
  return response.json()
}
