/**
 * scripts/test-db.ts
 * Standalone diagnostic: connects to Aurora DSQL and tests founders table.
 * Run with: pnpm tsx scripts/test-db.ts
 */

import { Client } from 'pg'
import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts'

// ─── Load .env.development.local manually (tsx doesn't do this) ──────────────
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.development.local')
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      // Strip surrounding quotes
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
    console.log('[test-db] Loaded .env.development.local')
  } catch (e) {
    console.warn('[test-db] Could not load .env.development.local:', (e as Error).message)
  }
}

loadEnv()

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n════════════════════════════════════════════')
  console.log('STEP 1: Attempting DSQL connection')
  console.log('════════════════════════════════════════════')
  console.log('PGHOST:', process.env.PGHOST)
  console.log('PGUSER:', process.env.PGUSER)
  console.log('PGDATABASE:', process.env.PGDATABASE)
  console.log('AWS_REGION:', process.env.AWS_REGION)
  console.log('AWS_ROLE_ARN:', process.env.AWS_ROLE_ARN)
  console.log('VERCEL_OIDC_TOKEN present:', !!process.env.VERCEL_OIDC_TOKEN)

  // ── Resolve credentials (mirror lib/db.ts logic exactly) ──
  let credentials: any = null

  if (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN) {
    console.log('\n[test-db] Using OIDC token to assume role...')
    try {
      const stsClient = new STSClient({ region: process.env.AWS_REGION || 'us-east-1' })
      const command = new AssumeRoleWithWebIdentityCommand({
        RoleArn: process.env.AWS_ROLE_ARN,
        RoleSessionName: 'waitlyst-test-db',
        WebIdentityToken: process.env.VERCEL_OIDC_TOKEN,
      })
      const response = await stsClient.send(command)
      credentials = {
        accessKeyId: response.Credentials?.AccessKeyId || '',
        secretAccessKey: response.Credentials?.SecretAccessKey || '',
        sessionToken: response.Credentials?.SessionToken || '',
      }
      console.log('[test-db] ✅ Got temporary credentials. AccessKeyId:', credentials.accessKeyId?.slice(0, 8) + '...')
    } catch (stsError: any) {
      console.error('[test-db] ❌ STS AssumeRole FAILED:', stsError.message)
      console.error('[test-db]    Code:', stsError.$metadata?.httpStatusCode, stsError.name)
      process.exit(1)
    }
  } else {
    // Fallback: use direct access keys (for dsql.ts style)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('[test-db] Using direct AWS credentials (no OIDC token)')
      credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
      }
    } else {
      console.error('[test-db] ❌ No credentials available (need VERCEL_OIDC_TOKEN+AWS_ROLE_ARN or AWS_ACCESS_KEY_ID+AWS_SECRET_ACCESS_KEY)')
      process.exit(1)
    }
  }

  // ── Create DsqlSigner ──────────────────────────────────────────────────────
  // NOTE: In @aws-sdk/dsql-signer v3.1070.0, the constructor REQUIRES `hostname`
  // and getDbConnectAuthToken() takes NO parameters.
  const hostname = process.env.PGHOST || ''

  console.log('\n[test-db] Creating DsqlSigner with hostname:', hostname)
  let signer: DsqlSigner
  try {
    signer = new DsqlSigner({
      hostname,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials,
    })
    console.log('[test-db] ✅ DsqlSigner created')
  } catch (signerError: any) {
    console.error('[test-db] ❌ DsqlSigner construction FAILED:', signerError.message)
    process.exit(1)
  }

  // ── Get auth token ─────────────────────────────────────────────────────────
  // admin user requires getDbConnectAdminAuthToken() (no params in v3.x)
  console.log('\n[test-db] Requesting admin auth token (getDbConnectAdminAuthToken with no args)...')
  let authToken: string
  try {
    authToken = await signer.getDbConnectAdminAuthToken()
    console.log('[test-db] ✅ Auth token obtained, length:', authToken.length)
  } catch (tokenError: any) {
    console.error('[test-db] ❌ getDbConnectAdminAuthToken FAILED:', tokenError.message)
    console.error('[test-db]    Full error:', tokenError)
    process.exit(1)
  }

  // ── Connect to DB ──────────────────────────────────────────────────────────
  const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    port: 5432,
    ssl: true,
    password: authToken,
  })

  console.log('\n[test-db] Connecting to database...')
  try {
    await client.connect()
    console.log('[test-db] ✅ Connected to Aurora DSQL')
  } catch (connError: any) {
    console.error('[test-db] ❌ DB connect FAILED:', connError.message)
    console.error('[test-db]    Full error:', connError)
    process.exit(1)
  }

  // ══════════════════════════════════════════════════════════════════
  console.log('\n════════════════════════════════════════════')
  console.log('STEP 2: SELECT columns from founders table')
  console.log('════════════════════════════════════════════')
  try {
    const colResult = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'founders' ORDER BY ordinal_position`
    )
    if (colResult.rows.length === 0) {
      console.log('[test-db] ⚠️  No columns found - table may not exist!')
    } else {
      console.log('[test-db] Columns on founders table:')
      for (const row of colResult.rows) {
        console.log(`  - ${row.column_name}  (${row.data_type})`)
      }
    }
  } catch (e: any) {
    console.error('[test-db] ❌ Column query FAILED:', e.message)
  }

  // ══════════════════════════════════════════════════════════════════
  console.log('\n════════════════════════════════════════════')
  console.log('STEP 3: Attempt INSERT into founders')
  console.log('════════════════════════════════════════════')
  const testId = 'test-debug-001'
  const testEmail = 'debug-test@test.com'
  let insertOk = false
  try {
    await client.query(
      `INSERT INTO founders (id, email, name, password_hash, plan) VALUES ($1, $2, $3, $4, $5)`,
      [testId, testEmail, 'Debug Test', 'dummy-hash', 'free']
    )
    insertOk = true
    console.log('[test-db] ✅ INSERT succeeded')
  } catch (insertError: any) {
    console.error('[test-db] ❌ INSERT FAILED')
    console.error('[test-db]    message:', insertError.message)
    console.error('[test-db]    code:', insertError.code)
    console.error('[test-db]    detail:', insertError.detail)
    console.error('[test-db]    hint:', insertError.hint)
    console.error('[test-db]    full error:', insertError)
  }

  // ══════════════════════════════════════════════════════════════════
  if (insertOk) {
    console.log('\n════════════════════════════════════════════')
    console.log('STEP 4 (insert succeeded): SELECT inserted row')
    console.log('════════════════════════════════════════════')
    try {
      const selectResult = await client.query(`SELECT * FROM founders WHERE id = $1`, [testId])
      console.log('[test-db] Row found:', JSON.stringify(selectResult.rows[0], null, 2))
    } catch (e: any) {
      console.error('[test-db] ❌ SELECT FAILED:', e.message)
    }

    console.log('\n[test-db] Cleaning up test row...')
    try {
      await client.query(`DELETE FROM founders WHERE id = $1`, [testId])
      console.log('[test-db] ✅ Cleanup done')
    } catch (e: any) {
      console.error('[test-db] ❌ Cleanup FAILED:', e.message)
    }
  }

  await client.end()
  console.log('\n[test-db] Connection closed. Done.')
}

main().catch((err) => {
  console.error('[test-db] Fatal unhandled error:', err)
  process.exit(1)
})
