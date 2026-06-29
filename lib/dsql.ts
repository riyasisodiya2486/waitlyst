// @ts-nocheck
import { Client } from 'pg'
import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts'

function getAwsRegion() {
  return process.env.AWS_REGION || process.env.DSQL_AWS_REGION || 'us-east-1'
}

async function resolveCredentials() {
  if (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN) {
    const stsClient = new STSClient({ region: getAwsRegion() })
    const command = new AssumeRoleWithWebIdentityCommand({
      RoleArn: process.env.AWS_ROLE_ARN,
      RoleSessionName: 'waitlyst-dsql',
      WebIdentityToken: process.env.VERCEL_OIDC_TOKEN,
    })
    const response = await stsClient.send(command)
    return {
      accessKeyId: response.Credentials?.AccessKeyId || '',
      secretAccessKey: response.Credentials?.SecretAccessKey || '',
      sessionToken: response.Credentials?.SessionToken || '',
    }
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.DSQL_AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.DSQL_AWS_SECRET_ACCESS_KEY || ''
  const sessionToken = process.env.AWS_SESSION_TOKEN || process.env.DSQL_AWS_SESSION_TOKEN

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'No Aurora DSQL credentials available (need VERCEL_OIDC_TOKEN+AWS_ROLE_ARN or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or DSQL_AWS_ACCESS_KEY_ID/DSQL_AWS_SECRET_ACCESS_KEY)',
    )
  }

  return {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {}),
  }
}

// hostname is required at constructor time in @aws-sdk/dsql-signer v3.x
// A fresh signer is created per-connection so the hostname env var is read at runtime
async function makeSigner() {
  return new DsqlSigner({
    hostname: process.env.PGHOST || '',
    region: getAwsRegion(),
    credentials: await resolveCredentials(),
  })
}

export async function withDsql<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const signer = await makeSigner()
  const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    port: 5432,
    ssl: true,
    // admin user in Aurora DSQL requires getDbConnectAdminAuthToken()
    password: () => signer.getDbConnectAdminAuthToken(),
  })

  try {
    await client.connect()
    return await callback(client)
  } finally {
    await client.end()
  }
}

export async function query(sql: string, params: any[] = []) {
  return withDsql(async (client) => {
    const result = await client.query(sql, params)
    return result.rows
  })
}

export async function queryOne(sql: string, params: any[] = []) {
  return withDsql(async (client) => {
    const result = await client.query(sql, params)
    return result.rows[0] || null
  })
}

export async function execute(sql: string, params: any[] = []) {
  return withDsql(async (client) => {
    const result = await client.query(sql, params)
    return result.rowCount
  })
}

// Manual referential integrity checks (Aurora DSQL doesn't support FOREIGN KEYs)

export async function campaignExists(campaignId: string): Promise<boolean> {
  const result = await queryOne('SELECT id FROM campaigns WHERE id = $1', [campaignId])
  return !!result
}

export async function founderExists(founderId: string): Promise<boolean> {
  const result = await queryOne('SELECT id FROM founders WHERE id = $1', [founderId])
  return !!result
}

export async function participantExists(participantId: string): Promise<boolean> {
  const result = await queryOne('SELECT id FROM participants WHERE id = $1', [participantId])
  return !!result
}

export async function rewardTierExists(tierId: string): Promise<boolean> {
  const result = await queryOne('SELECT id FROM reward_tiers WHERE id = $1', [tierId])
  return !!result
}
