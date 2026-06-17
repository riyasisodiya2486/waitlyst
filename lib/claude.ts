import Anthropic from '@anthropic-ai/sdk'
import type { ReferralEvent } from './dynamo'

let clientInstance: Anthropic | null = null

function getClient() {
  if (!clientInstance && process.env.ANTHROPIC_API_KEY) {
    clientInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return clientInstance
}

export interface FraudAnalysisResult {
  email: string
  ip: string
  referrals: number
  riskScore: number
  reason: string
}

export interface RewardTierSuggestion {
  min_referrals: number
  reward_label: string
  tier_order: number
}

export async function analyzeFraud(events: ReferralEvent[]): Promise<FraudAnalysisResult[]> {
  const client = getClient()
  if (!client) {
    return []
  }

  if (!events || events.length === 0) {
    return []
  }

  const eventSummary = events
    .slice(-100)
    .map((e) => `${e.type}: ${e.email} from IP ${e.ip_address || 'unknown'} at ${new Date(e.timestamp).toISOString()}`)
    .join('\n')

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze these recent signup events for fraud patterns and return ONLY valid JSON with no markdown:

${eventSummary}

Return a JSON array with objects containing: email, ip, referrals (0-50), riskScore (0-100), reason (string).
Only include entries with riskScore > 60. Return empty array [] if no fraud detected.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }
  } catch (e) {
    console.error('[v0] Failed to analyze fraud:', e)
  }

  return []
}

export async function suggestRewardTiers(campaignDescription: string): Promise<RewardTierSuggestion[]> {
  const client = getClient()
  if (!client) {
    return [
      { min_referrals: 10, reward_label: 'Early Bird', tier_order: 1 },
      { min_referrals: 50, reward_label: 'Power User', tier_order: 2 },
      { min_referrals: 200, reward_label: 'Legendary', tier_order: 3 },
    ]
  }

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `For a waitlist campaign with this description, suggest 3 reward tiers and return ONLY valid JSON with no markdown:

${campaignDescription}

Return a JSON array with 3 objects: {min_referrals: number, reward_label: string, tier_order: 1|2|3}
Make tiers progressive (e.g., 10, 50, 200 referrals).`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const tiers = JSON.parse(jsonMatch[0])
        return tiers.slice(0, 3)
      }
    }
  } catch (e) {
    console.error('[v0] Failed to suggest tiers:', e)
  }

  return [
    { min_referrals: 10, reward_label: 'Early Bird', tier_order: 1 },
    { min_referrals: 50, reward_label: 'Power User', tier_order: 2 },
    { min_referrals: 200, reward_label: 'Legendary', tier_order: 3 },
  ]
}
