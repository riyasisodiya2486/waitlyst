import { SignJWT } from 'jose'
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

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-length')

async function main() {
  console.log('=== Step 6: AI Fraud Detection ===')
  console.log('ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY)

  const founderId = 'b500ee2b-1913-4fd2-b9e1-13985a6e4e26'
  const campaignId = '1f6ceea6-b2f6-46d7-a3f5-d6ae738af99c'

  const token = await new SignJWT({ founderId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + 1000 * 60 * 60))
    .sign(secret)

  console.log('\nPOST /api/fraud/analyze with campaignId:', campaignId)
  const res = await fetch('http://localhost:3000/api/fraud/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session=${token}`
    },
    body: JSON.stringify({ campaign_id: campaignId })
  })

  console.log('HTTP Status:', res.status)
  const json = await res.json()
  console.log('Response:', JSON.stringify(json, null, 2))
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
