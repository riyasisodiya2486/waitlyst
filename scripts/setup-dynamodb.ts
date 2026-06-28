// @ts-nocheck
import { DynamoDBClient, CreateTableCommand, UpdateTimeToLiveCommand } from '@aws-sdk/client-dynamodb'
import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.development.local')
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const k = t.slice(0, eq).trim()
      let v = t.slice(eq + 1).trim()
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1)
      if (!process.env[k]) process.env[k] = v
    }
  } catch (e) {}
}
loadEnv()

async function resolveCredentials() {
  if (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN) {
    const stsClient = new STSClient({ region: process.env.AWS_REGION || 'us-east-1' })
    const command = new AssumeRoleWithWebIdentityCommand({
      RoleArn: process.env.AWS_ROLE_ARN,
      RoleSessionName: 'waitlyst-app',
      WebIdentityToken: process.env.VERCEL_OIDC_TOKEN,
    })
    const response = await stsClient.send(command)
    return {
      accessKeyId: response.Credentials?.AccessKeyId || '',
      secretAccessKey: response.Credentials?.SecretAccessKey || '',
      sessionToken: response.Credentials?.SessionToken || '',
    }
  }
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
    }
  }
  throw new Error('AWS credentials missing')
}

async function setupDynamoDB() {
  const credentials = await resolveCredentials()
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials,
  })

  const command = new CreateTableCommand({
    TableName: 'waitlyst-events',
    KeySchema: [
      { AttributeName: 'pk', KeyType: 'HASH' },
      { AttributeName: 'sk', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'pk', AttributeType: 'S' },
      { AttributeName: 'sk', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  })

  try {
    console.log('[v0] Creating DynamoDB table: waitlyst-events')
    const result = await client.send(command)
    console.log('[v0] Table created successfully:', result.TableDescription?.TableName)
    await client.send(
      new UpdateTimeToLiveCommand({
        TableName: 'waitlyst-events',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      })
    )
    console.log('[v0] TTL enabled on attribute: ttl')
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('[v0] Table already exists: waitlyst-events')
    } else {
      console.error('[v0] Failed to create table:', error.message)
      throw error
    }
  } finally {
    client.destroy()
  }
}

setupDynamoDB()
  .then(() => {
    console.log('[v0] DynamoDB setup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[v0] DynamoDB setup failed:', error)
    process.exit(1)
  })
