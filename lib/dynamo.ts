import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { existsSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

let clientInstance: DynamoDBClient | null = null

function getDynamoClient(): DynamoDBDocumentClient {
  if (!clientInstance) {
    clientInstance = new DynamoDBClient({
      region: process.env.DYNAMO_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.DYNAMO_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.DYNAMO_AWS_SECRET_ACCESS_KEY || '',
      },
    })
  }
  return DynamoDBDocumentClient.from(clientInstance)
}

const TABLE_NAME = 'waitlyst-events'
const LOCAL_DB_PATH = join(process.cwd(), 'waitlyst-events.json')

function readLocalEvents(): any[] {
  try {
    if (existsSync(LOCAL_DB_PATH)) {
      return JSON.parse(readFileSync(LOCAL_DB_PATH, 'utf8'))
    }
  } catch (e) {
    console.error('[DynamoDB Fallback] Failed to read local events:', e)
  }
  return []
}

function writeLocalEvents(events: any[]) {
  try {
    writeFileSync(LOCAL_DB_PATH, JSON.stringify(events, null, 2), 'utf8')
  } catch (e) {
    console.error('[DynamoDB Fallback] Failed to write local events:', e)
  }
}

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
  const ttl = Math.floor(now / 1000) + 30 * 24 * 60 * 60

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

  try {
    const docClient = getDynamoClient()
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: event }))
    console.log('[DynamoDB] Successfully logged event to AWS DynamoDB')
  } catch (err: any) {
    console.warn('[DynamoDB] AWS DynamoDB write failed, falling back to local storage. Reason:', err.message)
    const events = readLocalEvents()
    events.push(event)
    writeLocalEvents(events)
  }
}

export async function getRecentEvents(campaignId: string, hours: number = 24): Promise<ReferralEvent[]> {
  const cutoff = Date.now() - hours * 60 * 60 * 1000

  try {
    const docClient = getDynamoClient()
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk',
        FilterExpression: '#timestamp >= :cutoff',
        ExpressionAttributeNames: {
          '#timestamp': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':pk': `campaign#${campaignId}`,
          ':cutoff': cutoff,
        },
      })
    )
    return (result.Items as ReferralEvent[]) || []
  } catch (err: any) {
    console.warn('[DynamoDB] AWS DynamoDB query failed, falling back to local storage. Reason:', err.message)
    const events = readLocalEvents()
    return events.filter((e) => e.pk === `campaign#${campaignId}` && e.timestamp >= cutoff)
  }
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

  const item = {
    pk: `fraud#${campaignId}#${email}`,
    sk: `${now}#${uuidv4()}`,
    ...signal,
    ttl,
  }

  try {
    const docClient = getDynamoClient()
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    )
    console.log('[DynamoDB] Successfully put fraud signal to AWS DynamoDB')
  } catch (err: any) {
    console.warn('[DynamoDB] AWS DynamoDB put fraud signal failed, falling back to local storage. Reason:', err.message)
    const events = readLocalEvents()
    events.push(item)
    writeLocalEvents(events)
  }
}
