// @ts-nocheck
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, UpdateTimeToLiveCommand } from '@aws-sdk/client-dynamodb'
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

async function waitForTableActive(client: DynamoDBClient, tableName: string) {
  for (let attempt = 0; attempt < 15; attempt++) {
    const result = await client.send(new DescribeTableCommand({ TableName: tableName }))
    const status = result.Table?.TableStatus
    console.log(`[v0] Table status check ${attempt + 1}: ${status}`)
    if (status === 'ACTIVE') return
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error(`Timed out waiting for table ${tableName} to become ACTIVE`)
}

async function setupDynamoDB() {
  const tableName = 'waitlyst-events'
  const client = new DynamoDBClient({
    region: process.env.DYNAMO_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.DYNAMO_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.DYNAMO_AWS_SECRET_ACCESS_KEY || '',
    },
  })

  const command = new CreateTableCommand({
    TableName: tableName,
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
    console.log(`[v0] Creating DynamoDB table: ${tableName}`)
    const result = await client.send(command)
    console.log('[v0] Table created successfully:', result.TableDescription?.TableName)
    await waitForTableActive(client, tableName)
    await client.send(
      new UpdateTimeToLiveCommand({
        TableName: tableName,
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      })
    )
    console.log('[v0] TTL enabled on attribute: ttl')
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`[v0] Table already exists: ${tableName}`)
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
