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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ campaign_id: campaignId }),
  })
  if (!response.ok) throw new Error('Failed to fetch fraud data')
  const json = await response.json()
  return json.results || []
}

export async function signupToWaitlist(campaignSlug: string, email: string, referralCode?: string) {
  const response = await fetch('/api/waitlist/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      campaignSlug,
      email,
      referralCode,
    }),
  })
  if (!response.ok) throw new Error('Failed to signup')
  return response.json()
}

export async function suggestRewardTiers(description: string) {
  const response = await fetch('/api/campaigns/suggest-tiers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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
