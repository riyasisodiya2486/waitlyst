import Groq from 'groq-sdk'
import type { ReferralEvent } from './dynamo'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

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

type FraudAnalysisJson = {
  flaggedParticipantIds?: string[]
  reasons?: Record<string, string>
  riskScores?: Record<string, number>
}

type FraudEventLike = ReferralEvent & {
  participant_id?: string
  referral_count?: number
  device_info?: string
}

function getContentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part && typeof (part as { text?: unknown }).text === 'string') {
          return (part as { text: string }).text
        }
        return ''
      })
      .join('')
  }
  return ''
}

function parseJsonObject<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    try {
      return JSON.parse(cleaned) as T
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) return null
      try {
        return JSON.parse(match[0]) as T
      } catch {
        return null
      }
    }
  }
}

function fallbackFraudAnalysis(events: FraudEventLike[]): FraudAnalysisResult[] {
  if (!events.length) return []

  const ipCounts = new Map<string, number>()
  for (const event of events) {
    const ip = event.ip_address || 'unknown'
    ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1)
  }

  return events
    .map((event) => {
      const duplicateIpCount = ipCounts.get(event.ip_address || 'unknown') || 1
      const referrals = Number(event.referral_count || 0)
      const riskScore = Math.min(95, 35 + referrals * 8 + Math.max(0, duplicateIpCount - 1) * 12)
      return {
        email: event.email,
        ip: event.ip_address || 'unknown',
        referrals,
        riskScore,
        reason:
          duplicateIpCount > 1
            ? `Multiple signups share IP ${event.ip_address || 'unknown'} and the referral activity looks unusually clustered.`
            : 'Referral activity is elevated enough to merit a manual review.',
      }
    })
    .filter((item) => item.riskScore >= 60)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3)
}

export async function analyzeFraud(events: FraudEventLike[]): Promise<FraudAnalysisResult[]> {
  if (!process.env.GROQ_API_KEY) {
    return fallbackFraudAnalysis(events || [])
  }

  if (!events || events.length === 0) {
    return []
  }

  const normalizedEvents = events.slice(-100).map((event, index) => ({
    participantId: event.participant_id || event.email,
    email: event.email,
    ipAddress: event.ip_address || 'unknown',
    referralCount: Number(event.referral_count || 0),
    referredBy: event.referred_by || null,
    eventType: event.type,
    timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : null,
    deviceInfo: event.device_info || 'unknown',
    sequence: index + 1,
  }))

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a fraud analyst for a viral waitlist app. Return strict JSON only. No markdown, no explanation outside JSON.',
        },
        {
          role: 'user',
          content: `Analyze the following waitlist activity and identify suspicious participants. Focus on shared IPs, unusual referral spikes, suspicious referral chains, and signup clustering. Return EXACTLY this JSON object shape: {"flaggedParticipantIds": string[], "reasons": Record<string,string>, "riskScores": Record<string,number>}. Only include participants that actually need review. Risk scores must be integers 0-100.\n\nEvents:\n${JSON.stringify(
            normalizedEvents,
            null,
            2,
          )}`,
        },
      ],
    })

    const raw = getContentText(completion.choices[0]?.message?.content)
    const parsed = parseJsonObject<FraudAnalysisJson>(raw)

    if (!parsed?.flaggedParticipantIds?.length) {
      return []
    }

    const byId = new Map(normalizedEvents.map((event) => [event.participantId, event]))

    return parsed.flaggedParticipantIds
      .map((id) => {
        const event = byId.get(id)
        if (!event) return null
        const riskScore = Math.max(0, Math.min(100, Math.round(Number(parsed.riskScores?.[id] ?? 0))))
        return {
          email: event.email,
          ip: event.ipAddress,
          referrals: event.referralCount,
          riskScore,
          reason: parsed.reasons?.[id] || 'AI review flagged this participant for manual investigation.',
        }
      })
      .filter((item): item is FraudAnalysisResult => !!item)
      .filter((item) => item.riskScore >= 50)
      .sort((a, b) => b.riskScore - a.riskScore)
  } catch (e) {
    console.error('[ai] Failed to analyze fraud with Groq:', e)
    return fallbackFraudAnalysis(events)
  }
}

export async function suggestRewardTiers(campaignDescription: string): Promise<RewardTierSuggestion[]> {
  const fallback = [
    { min_referrals: 10, reward_label: 'Early Bird', tier_order: 1 },
    { min_referrals: 50, reward_label: 'Power User', tier_order: 2 },
    { min_referrals: 200, reward_label: 'Legendary', tier_order: 3 },
  ]

  if (!process.env.GROQ_API_KEY) {
    return fallback
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You design referral reward ladders for startup waitlists. Return strict JSON only.',
        },
        {
          role: 'user',
          content: `Create exactly 3 referral reward tiers for this waitlist campaign. Return EXACTLY this JSON object shape: {"tiers":[{"minReferrals":number,"rewardLabel":string},{"minReferrals":number,"rewardLabel":string},{"minReferrals":number,"rewardLabel":string}]}. Keep the tier names concise and the referral thresholds progressive.\n\nCampaign description:\n${campaignDescription}`,
        },
      ],
    })

    const raw = getContentText(completion.choices[0]?.message?.content)
    const parsed = parseJsonObject<{ tiers?: Array<{ minReferrals?: number; rewardLabel?: string }> }>(raw)

    if (!parsed?.tiers?.length) {
      return fallback
    }

    return parsed.tiers.slice(0, 3).map((tier, index) => ({
      min_referrals: Math.max(1, Math.round(Number(tier.minReferrals || fallback[index]?.min_referrals || 1))),
      reward_label: tier.rewardLabel?.trim() || fallback[index]?.reward_label || `Tier ${index + 1}`,
      tier_order: index + 1,
    }))
  } catch (e) {
    console.error('[ai] Failed to suggest reward tiers with Groq:', e)
    return fallback
  }
}
