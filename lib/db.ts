import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts'
import { Client } from 'pg'

let signerInstance: DsqlSigner | null = null

async function getSigner() {
  if (!signerInstance) {
    try {
      let credentials: any = null

      // If OIDC token is available, use it to get temporary credentials
      if (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN) {
        const stsClient = new STSClient({ region: process.env.AWS_REGION || 'us-east-1' })

        const command = new AssumeRoleWithWebIdentityCommand({
          RoleArn: process.env.AWS_ROLE_ARN,
          RoleSessionName: 'waitlyst-app',
          WebIdentityToken: process.env.VERCEL_OIDC_TOKEN,
        })

        const response = await stsClient.send(command)

        credentials = {
          accessKeyId: response.Credentials?.AccessKeyId || '',
          secretAccessKey: response.Credentials?.SecretAccessKey || '',
          sessionToken: response.Credentials?.SessionToken || '',
        }
      } else {
        throw new Error('AWS OIDC token or credentials not available')
      }

      signerInstance = new DsqlSigner({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials,
      })
    } catch (error) {
      console.error('[v0] Failed to create DSQL signer:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }
  return signerInstance
}

export async function getDbClient() {
  try {
    const signer = await getSigner()
    const client = new Client({
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      database: process.env.PGDATABASE,
      port: 5432,
      ssl: true,
      password: async () => {
        return await signer.getDbConnectAuthToken({
          hostname: process.env.PGHOST || '',
          port: 5432,
          username: process.env.PGUSER || '',
        })
      },
    })

    await client.connect()
    return client
  } catch (error) {
    console.error('[v0] Database connection failed:', error instanceof Error ? error.message : String(error))
    throw error
  }
}
