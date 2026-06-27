import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts'
import { readFileSync } from 'fs'

const lines = readFileSync('.env.development.local', 'utf8').split('\n')
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

async function resolveCredentials() {
  if (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN) {
    const stsClient = new STSClient({ region: process.env.AWS_REGION || 'us-east-1' })
    const command = new AssumeRoleWithWebIdentityCommand({
      RoleArn: process.env.AWS_ROLE_ARN,
      RoleSessionName: 'waitlyst-test-db',
      WebIdentityToken: process.env.VERCEL_OIDC_TOKEN,
    })
    const response = await stsClient.send(command)
    return {
      accessKeyId: response.Credentials?.AccessKeyId || '',
      secretAccessKey: response.Credentials?.SecretAccessKey || '',
      sessionToken: response.Credentials?.SessionToken || '',
    }
  }
  throw new Error('OIDC Token or Role ARN missing')
}

async function main() {
  console.log('--- Step 3: DynamoDB Event Logging Verification ---')
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
  })
  const docClient = DynamoDBDocumentClient.from(client)


  
  // Describe table to check schema keys
  try {
    const desc = await client.send(new DescribeTableCommand({ TableName: 'waitlyst-events' }))
    console.log('Table KeySchema:', JSON.stringify(desc.Table?.KeySchema, null, 2))
  } catch (e: any) {
    console.log('Could not describe table (maybe it does not exist):', e.message)
    // Run setup if it does not exist
    return
  }

  // Scan or Query recent events
  console.log('\nScanning waitlyst-events table...')
  try {
    const scanResult = await docClient.send(new ScanCommand({ TableName: 'waitlyst-events' }))
    console.log('Scan Items count:', scanResult.Items?.length)
    console.log('Scan Items:', JSON.stringify(scanResult.Items, null, 2))
  } catch (e: any) {
    console.error('Scan failed:', e.message)
  }
}

main().catch(console.error)
