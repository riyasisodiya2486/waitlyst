import { Client } from 'pg'
import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts'

async function runMigration() {
  console.log('[v0] Starting migration: add password_hash column to founders table...')

  let client: Client | null = null

  try {
    // Use Vercel OIDC token to get AWS credentials
    let credentials: any = null

    if (process.env.VERCEL_OIDC_TOKEN) {
      console.log('[v0] Using Vercel OIDC token for authentication')
      
      const stsClient = new STSClient({ region: process.env.AWS_REGION || 'us-east-1' })
      
      const command = new AssumeRoleWithWebIdentityCommand({
        RoleArn: process.env.AWS_ROLE_ARN,
        RoleSessionName: 'v0-migration',
        WebIdentityToken: process.env.VERCEL_OIDC_TOKEN,
      })
      
      const response = await stsClient.send(command)
      
      credentials = {
        accessKeyId: response.Credentials?.AccessKeyId || '',
        secretAccessKey: response.Credentials?.SecretAccessKey || '',
        sessionToken: response.Credentials?.SessionToken || '',
      }
      
      console.log('[v0] Successfully obtained temporary AWS credentials')
    } else {
      throw new Error('VERCEL_OIDC_TOKEN not found in environment')
    }

    // Create DSQL signer and get the token generator
    const signer = new DsqlSigner({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials,
    })

    // Create database client with password generator function
    client = new Client({
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      database: process.env.PGDATABASE,
      port: 5432,
      ssl: true,
      password: async () => {
        // Generate IAM authentication token using SigV4
        return await signer.getDbConnectAuthToken({
          hostname: process.env.PGHOST || '',
          port: 5432,
          username: process.env.PGUSER || '',
        })
      },
    })

    await client.connect()
    console.log('[v0] Connected to database')

    // Check if column already exists
    const result = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'founders' AND column_name = 'password_hash'
      ) as exists`
    )

    if (result.rows[0].exists) {
      console.log('[v0] Column password_hash already exists. Skipping migration.')
      return
    }

    // Add password_hash column
    await client.query('ALTER TABLE founders ADD COLUMN password_hash TEXT;')
    console.log('[v0] Successfully added password_hash column to founders table')

    // Add fraud_score and fraud_status to participants if they don't exist
    const fraudScoreResult = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'participants' AND column_name = 'fraud_score'
      ) as exists`
    )

    if (!fraudScoreResult.rows[0].exists) {
      await client.query('ALTER TABLE participants ADD COLUMN fraud_score INTEGER DEFAULT 0;')
      console.log('[v0] Added fraud_score column to participants')
    }

    const fraudStatusResult = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'participants' AND column_name = 'fraud_status'
      ) as exists`
    )

    if (!fraudStatusResult.rows[0].exists) {
      await client.query("ALTER TABLE participants ADD COLUMN fraud_status TEXT DEFAULT 'clean';")
      console.log('[v0] Added fraud_status column to participants')
    }

    console.log('[v0] Migration completed successfully!')
  } catch (error) {
    console.error('[v0] Migration failed:', error instanceof Error ? error.message : String(error))
    throw error
  } finally {
    if (client) {
      await client.end()
    }
  }
}

runMigration().catch((error) => {
  console.error('[v0] Fatal error:', error)
  process.exit(1)
})
