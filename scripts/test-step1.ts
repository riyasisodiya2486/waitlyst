import { getDbClient } from '../lib/db'
import { SignJWT } from 'jose'
import { readFileSync } from 'fs'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Load env variables manually
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

const secret = new TextEncoder().encode(process.env.AUTH_SECRET)

async function main() {
  console.log('--- Step 1: Campaign Creation ---')
  const client = await getDbClient()
  console.log('Connected to DB')

  // Find or create founder creator@mailtest.com
  let founderId = ''
  const existing = await client.query("SELECT id FROM founders WHERE email = 'creator@mailtest.com'")
  if (existing.rows.length > 0) {
    founderId = existing.rows[0].id
    console.log('Found existing founder with ID:', founderId)
  } else {
    founderId = uuidv4()
    const passwordHash = await bcrypt.hash('Password12345!', 10)
    await client.query(
      "INSERT INTO founders (id, email, name, password_hash, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [founderId, 'creator@mailtest.com', 'Campaign Creator', passwordHash, 'free', new Date()]
    )
    console.log('Created founder with ID:', founderId)
  }

  // Create signed session token (JWT)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const token = await new SignJWT({ founderId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)

  // Call POST /api/campaigns
  const url = 'http://localhost:3000/api/campaigns'
  const payload = {
    title: 'New Launch Waitlist',
    description: 'A brand new test waitlist campaign.',
    rewardTiers: [
      { minReferrals: 3, rewardLabel: 'Early Access' },
      { minReferrals: 7, rewardLabel: 'Pro Tier Free' }
    ]
  }

  console.log('\nSending HTTP POST to:', url)
  console.log('Payload:', JSON.stringify(payload, null, 2))

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${token}`
      },
      body: JSON.stringify(payload)
    })

    console.log('HTTP Status Code:', res.status)
    const json = await res.json()
    console.log('Response Body:', JSON.stringify(json, null, 2))

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`)
    }

    const campaignId = json.id

    // Now query campaigns table
    console.log('\nQuerying campaigns table directly for the created campaign...')
    const dbResult = await client.query(
      "SELECT id, founder_id, title, description, slug, status, created_at FROM campaigns WHERE id = $1",
      [campaignId]
    )

    console.log('DB Query Result:', JSON.stringify(dbResult.rows[0], null, 2))

    // Query reward tiers
    console.log('\nQuerying reward_tiers table...')
    const tiersResult = await client.query(
      "SELECT id, campaign_id, min_referrals, reward_label, tier_order FROM reward_tiers WHERE campaign_id = $1 ORDER BY tier_order ASC",
      [campaignId]
    )
    console.log('Tiers Query Result:', JSON.stringify(tiersResult.rows, null, 2))

  } catch (error) {
    console.error('Error during HTTP request/Query:', error)
  } finally {
    await client.end()
  }
}

main().catch(console.error)
