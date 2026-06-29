const base = process.env.APP_URL || 'http://localhost:3000'
const email = `smoke.${Date.now()}@example.com`
const out = (name: string, ok: boolean) => console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)

async function main() {
  const signup = await fetch(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Smoke User', email, password: 'SmokePass123!' }) })
  out('founder signup', signup.ok)
  const cookie = signup.headers.get('set-cookie') || ''
  const campaign = await fetch(`${base}/api/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ title: `Smoke Campaign ${Date.now()}`, description: 'Manual smoke test', rewardTiers: [] }) })
  out('campaign creation', campaign.ok)
  const created = campaign.ok ? await campaign.json() : {}
  const waitlist = await fetch(`${base}/api/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaign_id: created.id, email: `join.${Date.now()}@example.com` }) })
  out('public waitlist signup', waitlist.ok)
  const leaderboard = await fetch(`${base}/api/leaderboard/${created.id}`)
  out('leaderboard fetch', leaderboard.ok)
}

main().catch(() => {
  out('founder signup', false)
  out('campaign creation', false)
  out('public waitlist signup', false)
  out('leaderboard fetch', false)
})
