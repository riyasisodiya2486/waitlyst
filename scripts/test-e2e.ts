// @ts-nocheck
/**
 * Full E2E test: Steps 1-7
 * Runs through all test steps sequentially with real DB verification
 */
import { readFileSync, existsSync, unlinkSync } from 'fs'
import { getDbClient } from '../lib/db'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Load env
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

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-length'
const secret = new TextEncoder().encode(AUTH_SECRET)
const BASE = 'http://localhost:3000'

async function makeToken(founderId: string) {
  return new SignJWT({ founderId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    .sign(secret)
}

async function post(url: string, body: any, token?: string) {
  const headers: any = { 'Content-Type': 'application/json' }
  if (token) headers['Cookie'] = `session=${token}`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  const json = await res.json()
  return { status: res.status, json }
}

async function get(url: string, token?: string) {
  const headers: any = {}
  if (token) headers['Cookie'] = `session=${token}`
  const res = await fetch(url, { headers })
  const json = await res.json()
  return { status: res.status, json }
}

async function main() {
  console.log('='.repeat(60))
  console.log('WAITLYST FULL E2E TEST - Steps 1 through 7')
  console.log('='.repeat(60))

  const client = await getDbClient()
  console.log('[DB] Connected:', client.database || 'waitlyst')

  // ============================================================
  // SETUP: Ensure clean founder
  // ============================================================
  const founderEmail = 'e2e-founder@waitlyst-test.com'
  await client.query("DELETE FROM founders WHERE email = $1", [founderEmail])
  console.log('[Setup] Cleaned up any prior test data')

  // ============================================================
  // STEP 1: AUTH — Signup founder via API
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 1: CAMPAIGN CREATION')
  console.log('='.repeat(60))

  // First create founder via signup API to get session cookie
  const signupRes = await post(`${BASE}/api/auth/signup`, {
    name: 'E2E Test Founder',
    email: founderEmail,
    password: 'TestPass12345!'
  })
  console.log('[1a] POST /api/auth/signup →', signupRes.status)
  console.log('  Body:', JSON.stringify(signupRes.json, null, 2))

  if (signupRes.status !== 200) throw new Error('Signup failed')
  const founderId = signupRes.json.id

  // Create session token matching the app's AUTH_SECRET
  const token = await makeToken(founderId)

  // Create campaign via API
  const campaignPayload = {
    title: 'E2E Launch Waitlist',
    description: 'Full end-to-end test campaign',
    rewardTiers: [
      { minReferrals: 3, rewardLabel: 'Early Access' },
      { minReferrals: 10, rewardLabel: 'Pro Tier Free' }
    ]
  }
  console.log('\n[1b] POST /api/campaigns payload:', JSON.stringify(campaignPayload, null, 2))
  const campaignRes = await post(`${BASE}/api/campaigns`, campaignPayload, token)
  console.log('[1b] POST /api/campaigns → HTTP', campaignRes.status)
  console.log('  Body:', JSON.stringify(campaignRes.json, null, 2))

  if (campaignRes.status !== 200) throw new Error('Campaign creation failed')
  const { id: campaignId, slug: campaignSlug } = campaignRes.json

  // Query DB directly
  const dbCampaign = await client.query(
    "SELECT id, founder_id, title, slug, status FROM campaigns WHERE id = $1",
    [campaignId]
  )
  console.log('\n[1c] DB campaigns table direct query:')
  console.log('  Row:', JSON.stringify(dbCampaign.rows[0], null, 2))
  console.log('[1c] founder_id matches?', dbCampaign.rows[0].founder_id === founderId ? 'YES ✅' : 'NO ❌')

  const dbTiers = await client.query(
    "SELECT min_referrals, reward_label, tier_order FROM reward_tiers WHERE campaign_id = $1 ORDER BY tier_order",
    [campaignId]
  )
  console.log('[1d] reward_tiers:', JSON.stringify(dbTiers.rows, null, 2))

  // ============================================================
  // STEP 2: PUBLIC SIGNUP
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 2: PUBLIC SIGNUP')
  console.log('='.repeat(60))

  const signupPayload = { campaignSlug, email: 'user-alice@waitlyst-test.com' }
  console.log('[2a] POST /api/waitlist/signup payload:', JSON.stringify(signupPayload))
  const waitlistRes = await post(`${BASE}/api/waitlist/signup`, signupPayload)
  console.log('[2a] HTTP', waitlistRes.status)
  console.log('  Body:', JSON.stringify(waitlistRes.json, null, 2))

  if (waitlistRes.status !== 200) throw new Error('Waitlist signup failed')
  const { rank: aliceRank, referralCode: aliceCode } = waitlistRes.json

  const dbParticipant = await client.query(
    "SELECT id, email, rank, referral_code, referral_count, referred_by FROM participants WHERE campaign_id = $1 AND email = $2",
    [campaignId, 'user-alice@waitlyst-test.com']
  )
  console.log('\n[2b] participants DB row:', JSON.stringify(dbParticipant.rows[0], null, 2))

  // ============================================================
  // STEP 3: DYNAMODB EVENT LOGGING (local file fallback)
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 3: DYNAMODB EVENT LOGGING')
  console.log('='.repeat(60))
  const eventsFile = 'waitlyst-events.json'
  if (existsSync(eventsFile)) {
    const events = JSON.parse(readFileSync(eventsFile, 'utf8'))
    const aliceEvent = events.find((e: any) => e.email === 'user-alice@waitlyst-test.com')
    if (aliceEvent) {
      console.log('[3] ✅ Event logged to local fallback file:')
      console.log('  ', JSON.stringify(aliceEvent, null, 2))
    } else {
      console.log('[3] ⚠️  Event not yet in local file (may still be writing)')
    }
  } else {
    console.log('[3] ⚠️  waitlyst-events.json does not exist yet')
  }

  // ============================================================
  // STEP 4: REFERRAL TRACKING
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 4: REFERRAL TRACKING')
  console.log('='.repeat(60))

  console.log('[4a] Alice referral code:', aliceCode)
  const refPayload = { campaignSlug, email: 'user-bob@waitlyst-test.com', referralCode: aliceCode }
  console.log('[4a] Signing up Bob with Alice referral code...')
  const bobRes = await post(`${BASE}/api/waitlist/signup`, refPayload)
  console.log('[4a] HTTP', bobRes.status, JSON.stringify(bobRes.json))

  const afterReferral = await client.query(
    "SELECT email, rank, referral_code, referral_count, referred_by FROM participants WHERE campaign_id = $1 ORDER BY rank",
    [campaignId]
  )
  console.log('\n[4b] Participants after referral:')
  for (const row of afterReferral.rows) console.log('  ', JSON.stringify(row))
  const aliceAfter = afterReferral.rows.find(r => r.email === 'user-alice@waitlyst-test.com')
  console.log('[4c] Alice referral_count incremented?', aliceAfter?.referral_count === 1 ? 'YES ✅' : `NO ❌ (got ${aliceAfter?.referral_count})`)

  // ============================================================
  // STEP 5: LEADERBOARD
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 5: LEADERBOARD')
  console.log('='.repeat(60))

  const leaderRes = await get(`${BASE}/api/leaderboard/${campaignId}`)
  console.log('[5] GET /api/leaderboard/:id → HTTP', leaderRes.status)
  console.log('[5] Leaderboard data:')
  for (const row of leaderRes.json) console.log('  ', JSON.stringify(row))
  console.log('[5] Shows both participants?', leaderRes.json.length >= 2 ? 'YES ✅' : `NO ❌ (got ${leaderRes.json.length} rows)`)

  // ============================================================
  // STEP 6: AI FRAUD DETECTION
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 6: AI FRAUD DETECTION')
  console.log('='.repeat(60))
  console.log('[6] ANTHROPIC_API_KEY set?', process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO — Claude will return [] (no key)')

  const fraudRes = await post(`${BASE}/api/fraud/analyze`, { campaignId }, token)
  console.log('[6] POST /api/fraud/analyze → HTTP', fraudRes.status)
  console.log('[6] Response:', JSON.stringify(fraudRes.json, null, 2))

  // Check DB for fraud_score updates
  const fraudDb = await client.query(
    "SELECT email, fraud_score, fraud_status FROM participants WHERE campaign_id = $1",
    [campaignId]
  )
  console.log('[6] fraud_score in DB:', JSON.stringify(fraudDb.rows, null, 2))

  // ============================================================
  // STEP 7: STRIPE BILLING
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 7: STRIPE BILLING')
  console.log('='.repeat(60))
  console.log('[7] STRIPE_SECRET_KEY set?', process.env.STRIPE_SECRET_KEY ? 'YES' : 'NO')
  console.log('[7] STRIPE_PRICE_ID set?', process.env.STRIPE_PRICE_ID ? 'YES' : 'NO — will fail with 500')

  const checkoutRes = await post(`${BASE}/api/billing/checkout`, {}, token)
  console.log('[7] POST /api/billing/checkout → HTTP', checkoutRes.status)
  console.log('[7] Response:', JSON.stringify(checkoutRes.json, null, 2))

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))

  await client.end()
}

main().catch(e => { console.error('\n[FATAL]', e.message); process.exit(1) })

