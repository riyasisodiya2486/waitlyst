import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

const TABLE_NAME = 'waitlyst-events'

export interface ReferralEvent {
  pk: string
  sk: string
  type: 'signup' | 'referral' | 'fraud_detected'
  campaign_id: string
  email: string
  referral_code?: string
  ip_address?: string
  referred_by?: string
  timestamp: number
  ttl: number
}

export interface FraudSignal {
  campaign_id: string
  email: string
  ip_address: string
  signal_type: string
  severity: number
  timestamp: number
}

export async function logReferralEvent(
  campaignId: string,
  type: 'signup' | 'referral' | 'fraud_detected',
  data: {
    email: string
    referralCode?: string
    ipAddress?: string
    referredBy?: string
  }
): Promise<void> {
  const now = Date.now()
  const ttl = Math.floor(now / 1000) + 30 * 24 * 60 * 60 // 30 days

  const event: ReferralEvent = {
    pk: `campaign#${campaignId}`,
    sk: `${type}#${now}#${uuidv4()}`,
    type,
    campaign_id: campaignId,
    email: data.email,
    referral_code: data.referralCode,
    ip_address: data.ipAddress,
    referred_by: data.referredBy,
    timestamp: now,
    ttl,
  }

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: event }))
}

export async function getRecentEvents(
  campaignId: string,
  hours: number = 24
): Promise<ReferralEvent[]> {
  const cutoff = Date.now() - hours * 60 * 60 * 1000

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND #sk >= :sk',
      ExpressionAttributeNames: { '#sk': 'sk' },
      ExpressionAttributeValues: {
        ':pk': `campaign#${campaignId}`,
        ':sk': `signup#${cutoff}`,
      },
    })
  )

  return (result.Items as ReferralEvent[]) || []
}

export async function putFraudSignal(
  campaignId: string,
  email: string,
  ipAddress: string,
  signalType: string,
  severity: number
): Promise<void> {
  const signal: FraudSignal = {
    campaign_id: campaignId,
    email,
    ip_address: ipAddress,
    signal_type: signalType,
    severity,
    timestamp: Date.now(),
  }

  const now = Date.now()
  const ttl = Math.floor(now / 1000) + 30 * 24 * 60 * 60

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `fraud#${campaignId}#${email}`,
        sk: `${now}#${uuidv4()}`,
        ...signal,
        ttl,
      },
    })
  )
}
