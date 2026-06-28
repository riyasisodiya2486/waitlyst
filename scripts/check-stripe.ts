// @ts-nocheck
import { readFileSync } from 'fs'
import Stripe from 'stripe'

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

async function main() {
  const s = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' })
  const prices = await s.prices.list({ active: true, limit: 10 })
  console.log('Active Stripe prices:', prices.data.length)
  for (const p of prices.data) {
    console.log(' ', p.id, `$${(p.unit_amount||0)/100}`, p.currency, p.recurring?.interval || 'one-time')
  }
  if (prices.data.length === 0) {
    console.log('\nNo prices found — creating a test price...')
    const product = await s.products.create({ name: 'Waitlyst Pro' })
    const price = await s.prices.create({
      product: product.id,
      unit_amount: 2900,
      currency: 'usd',
      recurring: { interval: 'month' }
    })
    console.log('Created price:', price.id)
    console.log('\nAdd to .env.development.local:')
    console.log(`STRIPE_PRICE_ID='${price.id}'`)
  } else {
    const price = prices.data[0]
    console.log('\nUse this existing price ID:')
    console.log(`STRIPE_PRICE_ID='${price.id}'`)
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })

