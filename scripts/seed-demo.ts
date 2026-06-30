// @ts-nocheck
import { readFileSync } from 'fs'
import bcrypt from 'bcryptjs'
import { Client } from 'pg'
import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts'
import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { v4 as uuidv4 } from 'uuid'

function loadEnv() {
  const lines = readFileSync('.env.development.local', 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let value = t.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function getAwsRegion() {
  return process.env.AWS_REGION || process.env.DSQL_AWS_REGION || 'us-east-1'
}

async function resolveCredentials() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.DSQL_AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.DSQL_AWS_SECRET_ACCESS_KEY || ''
  const sessionToken = process.env.AWS_SESSION_TOKEN || process.env.DSQL_AWS_SESSION_TOKEN

  if (accessKeyId && secretAccessKey) {
    return {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    }
  }

  if (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN) {
    const sts = new STSClient({ region: getAwsRegion() })
    const assumed = await sts.send(
      new AssumeRoleWithWebIdentityCommand({
        RoleArn: process.env.AWS_ROLE_ARN,
        RoleSessionName: 'waitlyst-seed-demo',
        WebIdentityToken: process.env.VERCEL_OIDC_TOKEN,
      })
    )

    return {
      accessKeyId: assumed.Credentials?.AccessKeyId || '',
      secretAccessKey: assumed.Credentials?.SecretAccessKey || '',
      sessionToken: assumed.Credentials?.SessionToken || '',
    }
  }

  throw new Error(
    'No Aurora DSQL credentials available for seeding (need AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or DSQL_AWS_ACCESS_KEY_ID/DSQL_AWS_SECRET_ACCESS_KEY; OIDC remains optional via VERCEL_OIDC_TOKEN+AWS_ROLE_ARN)',
  )
}

async function getDirectDsqlClient() {
  const signer = new DsqlSigner({
    hostname: process.env.PGHOST || '',
    region: getAwsRegion(),
    credentials: await resolveCredentials(),
  })

  const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    port: 5432,
    ssl: true,
    password: await signer.getDbConnectAdminAuthToken(),
  })

  await client.connect()
  return client
}

async function main() {
  loadEnv()

  const founderId = uuidv4()
  const campaignId = uuidv4()
  const founderEmail = 'founder@waitlyst.app'
  const founderPassword = 'DemoPass123!'
  const passwordHash = await bcrypt.hash(founderPassword, 10)
  const now = new Date()

  const participants = [
    { email: 'jordan@gmail.com', referralCount: 12, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'sam.lee@outlook.com', referralCount: 8, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'casey.founder@yahoo.com', referralCount: 5, referredByEmail: 'jordan@gmail.com', fraudScore: 0, fraudStatus: 'clean' },
    { email: 'taylor.nguyen@gmail.com', referralCount: 4, referredByEmail: 'sam.lee@outlook.com', fraudScore: 82, fraudStatus: 'flagged' },
    { email: 'alexis.morgan@icloud.com', referralCount: 4, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'miles.parker@gmail.com', referralCount: 3, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'riley.james@outlook.com', referralCount: 3, referredByEmail: 'jordan@gmail.com', fraudScore: 0, fraudStatus: 'clean' },
    { email: 'devon.kim@gmail.com', referralCount: 3, referredByEmail: null, fraudScore: 75, fraudStatus: 'flagged' },
    { email: 'quinn.brooks@yahoo.com', referralCount: 2, referredByEmail: 'casey.founder@yahoo.com', fraudScore: 0, fraudStatus: 'clean' },
    { email: 'jamie.carter@proton.me', referralCount: 2, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'avery.wilson@gmail.com', referralCount: 2, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'blake.turner@outlook.com', referralCount: 2, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'harper.clark@gmail.com', referralCount: 1, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'logan.rivera@icloud.com', referralCount: 1, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'peyton.bell@gmail.com', referralCount: 1, referredByEmail: 'sam.lee@outlook.com', fraudScore: 0, fraudStatus: 'clean' },
    { email: 'cameron.mills@yahoo.com', referralCount: 1, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'dakota.price@gmail.com', referralCount: 1, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'emerson.ross@outlook.com', referralCount: 1, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'finley.adams@gmail.com', referralCount: 0, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'greyson.hall@icloud.com', referralCount: 0, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'kai.murphy@gmail.com', referralCount: 0, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'reese.cook@outlook.com', referralCount: 0, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'sloane.bailey@yahoo.com', referralCount: 0, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'teagan.foster@gmail.com', referralCount: 0, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
    { email: 'wyatt.bennett@proton.me', referralCount: 0, referredByEmail: null, fraudScore: 0, fraudStatus: 'clean' },
  ]

  participants.sort((a, b) => b.referralCount - a.referralCount || a.email.localeCompare(b.email))
  const referralCodeByEmail = new Map<string, string>()
  const participantRows = participants.map((participant, index) => {
    const referralCode = `ref${String(index + 1).padStart(2, '0')}acme`
    referralCodeByEmail.set(participant.email, referralCode)
    return {
      id: uuidv4(),
      email: participant.email,
      rank: index + 1,
      referral_code: referralCode,
      referral_count: participant.referralCount,
      referred_by_email: participant.referredByEmail,
      fraud_score: participant.fraudScore,
      fraud_status: participant.fraudStatus,
      ip_address: `10.0.0.${index + 10}`,
      created_at: new Date(now.getTime() + index * 60_000),
    }
  })

  const client = await getDirectDsqlClient()

  try {
    const connectionCheck = await client.query('select current_database() as db, current_user as db_user')
    console.log('[seed] Connected directly to Aurora DSQL:', connectionCheck.rows[0])

    await client.query('DELETE FROM reward_tiers')
    await client.query('DELETE FROM participants')
    await client.query('DELETE FROM campaigns')
    await client.query('DELETE FROM founders')

    await client.query(
      'INSERT INTO founders (id, email, name, password_hash, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [founderId, founderEmail, 'Alex Founder', passwordHash, 'pro', now]
    )

    await client.query(
      'INSERT INTO campaigns (id, founder_id, title, description, slug, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        campaignId,
        founderId,
        'Acme Launch',
        'Acme Launch is an invite-only early access program for a new AI-powered workflow tool for startup teams. Join the waitlist to unlock launch perks, move up the leaderboard, and earn referral rewards before public release.',
        'acme-launch',
        'live',
        now,
      ]
    )

    for (const tier of [
      { minReferrals: 5, rewardLabel: 'Lifetime free', order: 0 },
      { minReferrals: 15, rewardLabel: '6 months free', order: 1 },
      { minReferrals: 25, rewardLabel: '1 month free', order: 2 },
    ]) {
      await client.query(
        'INSERT INTO reward_tiers (id, campaign_id, min_referrals, reward_label, tier_order) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), campaignId, tier.minReferrals, tier.rewardLabel, tier.order]
      )
    }

    for (const row of participantRows) {
      await client.query(
        'INSERT INTO participants (id, campaign_id, email, rank, referral_code, referral_count, referred_by, ip_address, fraud_score, fraud_status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [
          row.id,
          campaignId,
          row.email,
          row.rank,
          row.referral_code,
          row.referral_count,
          row.referred_by_email ? referralCodeByEmail.get(row.referred_by_email) : null,
          row.ip_address,
          row.fraud_score,
          row.fraud_status,
          row.created_at,
        ]
      )
    }

    const participantCount = await client.query('SELECT count(*)::int AS count FROM participants')
    const sampleRows = await client.query(
      'SELECT email, rank, referral_count, referred_by, fraud_score, fraud_status FROM participants ORDER BY rank ASC LIMIT 3'
    )

    console.log('[seed] Founder login for demo: founder@waitlyst.app / DemoPass123!')
    console.log('[seed] Participant count:', participantCount.rows[0].count)
    console.log('[seed] Sample rows:', JSON.stringify(sampleRows.rows, null, 2))
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('[seed] Failed:', error)
  process.exit(1)
})
