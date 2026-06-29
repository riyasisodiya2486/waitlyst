import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts'
import { Client } from 'pg'

function getAwsRegion() {
  return process.env.AWS_REGION || process.env.DSQL_AWS_REGION || 'us-east-1'
}

async function resolveCredentials() {
  if (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN) {
    const stsClient = new STSClient({ region: getAwsRegion() })
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

  const directAccessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.DSQL_AWS_ACCESS_KEY_ID
  const directSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.DSQL_AWS_SECRET_ACCESS_KEY
  const directSessionToken = process.env.AWS_SESSION_TOKEN || process.env.DSQL_AWS_SESSION_TOKEN

  if (directAccessKeyId && directSecretAccessKey) {
    return {
      accessKeyId: directAccessKeyId,
      secretAccessKey: directSecretAccessKey,
      ...(directSessionToken ? { sessionToken: directSessionToken } : {}),
    }
  }

  throw new Error(
    'No Aurora DSQL credentials available (need VERCEL_OIDC_TOKEN+AWS_ROLE_ARN or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or DSQL_AWS_ACCESS_KEY_ID/DSQL_AWS_SECRET_ACCESS_KEY)',
  )
}

function shouldUseLocalFallback() {
  return process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1'
}

export async function getDbClient() {
  try {
    const credentials = await resolveCredentials()
    const hostname = process.env.PGHOST || ''
    const signer = new DsqlSigner({
      hostname,
      region: getAwsRegion(),
      credentials,
    })

    const adminToken = await signer.getDbConnectAdminAuthToken()

    let pgHost = hostname
    try {
      const { resolve4 } = await import('dns/promises')
      const ips = await resolve4(hostname)
      if (ips.length > 0) pgHost = ips[0]
    } catch {
      // fallback to hostname if DNS pre-resolution fails
    }

    const client = new Client({
      host: pgHost,
      user: process.env.PGUSER,
      database: process.env.PGDATABASE,
      port: 5432,
      ssl: pgHost !== hostname ? { servername: hostname } : true,
      password: adminToken,
    })

    await client.connect()
    return client
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)

    if (!shouldUseLocalFallback()) {
      console.error('[db] AWS DSQL connection failed in hosted/production mode. Local PostgreSQL fallback is disabled. Reason:', reason)
      throw error
    }

    console.warn('[db] AWS DSQL connection failed, falling back to local PostgreSQL. Reason:', reason)

    const localClient = new Client({
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      database: 'waitlyst',
      ssl: false,
    })

    try {
      await localClient.connect()
      console.log('[db] Connected to local PostgreSQL (fallback mode)')
      return localClient
    } catch (localError) {
      console.error('[db] Local PostgreSQL fallback also failed:', localError instanceof Error ? localError.message : String(localError))
      throw localError
    }
  }
}
