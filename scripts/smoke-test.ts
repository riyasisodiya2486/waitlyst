// scripts/smoke-test.ts
// Run with: pnpm tsx scripts/smoke-test.ts
// Set BASE_URL to your live URL to test production:
// BASE_URL=https://your-app.vercel.app pnpm tsx scripts/smoke-test.ts

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = `smoke_${Date.now()}@waitlyst-test.com`
const TEST_PASSWORD = 'SmokeTest123!'
const TEST_NAME = 'Smoke Tester'

let sessionCookie = ''
let campaignSlug = ''
let campaignId = ''
let referralCode = ''

// ─── helpers ─────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const results: { label: string; ok: boolean; detail: string }[] = []

function log(label: string, ok: boolean, detail = '') {
  const icon = ok ? '✅' : '❌'
  console.log(`${icon} ${label}${detail ? `  →  ${detail}` : ''}`)
  results.push({ label, ok, detail })
  ok ? passed++ : failed++
}

async function req(
  method: string,
  path: string,
  body?: object,
  withSession = false,
  manualRedirect = false
): Promise<{ status: number; data: any; cookie?: string; location?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (withSession && sessionCookie) headers['Cookie'] = sessionCookie

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: manualRedirect ? 'manual' : 'follow',
  })

  const setCookie = res.headers.get('set-cookie') || ''
  let data: any = {}
  const rawBody = await res.text()
  try { data = rawBody ? JSON.parse(rawBody) : {} } catch { data = { raw: rawBody.slice(0, 500) } }
  return { status: res.status, data, cookie: setCookie, location: res.headers.get('location') || undefined }
}

async function preflight(): Promise<boolean> {
  try {
    const login = await fetch(`${BASE_URL}/login`, { redirect: 'manual' })
    const campaigns = await fetch(`${BASE_URL}/api/campaigns`, { redirect: 'manual' })
    if (login.status === 200 && campaigns.status === 401) return true

    console.error(`\nSmoke test stopped before writes: BASE_URL does not look like this Waitlyst app.`)
    console.error(`  GET /login: ${login.status}${login.headers.get('location') ? ` → ${login.headers.get('location')}` : ''}`)
    console.error(`  GET /api/campaigns without a session: ${campaigns.status}`)
    console.error(`  Current BASE_URL: ${BASE_URL}`)
    return false
  } catch (error) {
    console.error(`\nSmoke test stopped before writes: could not reach ${BASE_URL}.`)
    console.error(error instanceof Error ? error.message : String(error))
    return false
  }
}

// ─── tests ───────────────────────────────────────────────────────────────────

async function testSignup() {
  console.log('\n── Auth ──────────────────────────────────────────')
  const { status, data, cookie } = await req('POST', '/api/auth/signup', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: TEST_NAME,
  })
  const ok = status === 200 || status === 201
  log('Founder signup', ok, `status ${status}`)
  if (!ok) log('Signup response body', false, JSON.stringify(data))
  if (cookie) sessionCookie = cookie.split(';')[0]
}

async function testLogin() {
  const { status, data, cookie } = await req('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  const ok = status === 200
  log('Founder login', ok, `status ${status}`)
  if (!ok) log('Login response body', false, JSON.stringify(data))
  if (cookie) sessionCookie = cookie.split(';')[0]
  log('Session cookie set', !!sessionCookie, sessionCookie ? 'cookie present' : 'no cookie found')
}

async function testWrongPassword() {
  const { status } = await req('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    password: 'wrongpassword',
  })
  log('Login rejects wrong password', status === 401, `status ${status}`)
}

async function testDashboardProtected() {
  const { status, location } = await req('GET', '/dashboard', undefined, false, true)
  const redirectPath = location ? new URL(location, BASE_URL).pathname : ''
  const ok = status >= 300 && status < 400 && redirectPath === '/login'
  log('Dashboard protected — redirects to login without session', ok, `status ${status}${redirectPath ? `, location: ${redirectPath}` : ''}`)
}

async function testCreateCampaign() {
  console.log('\n── Campaigns ─────────────────────────────────────')
  const { status, data } = await req(
    'POST',
    '/api/campaigns',
    {
      title: 'Smoke Test Launch',
      description: 'Automated smoke test campaign',
      rewardTiers: [
        { minReferrals: 3, rewardLabel: 'Early access', tierOrder: 1 },
        { minReferrals: 10, rewardLabel: 'Lifetime free', tierOrder: 2 },
      ],
    },
    true
  )
  const ok = status === 200 || status === 201
  log('Campaign creation', ok, `status ${status}`)
  if (ok && data.slug) {
    campaignSlug = data.slug
    campaignId = data.id
    log('Campaign slug generated', !!campaignSlug, campaignSlug)
  } else {
    log('Campaign slug in response', false, JSON.stringify(data))
  }
}

async function testListCampaigns() {
  const { status, data } = await req('GET', '/api/campaigns', undefined, true)
  const ok = status === 200 && Array.isArray(data)
  const hasNew = ok && data.some((c: any) => c.slug === campaignSlug)
  log('Campaign list returns array', ok, `status ${status}, count: ${Array.isArray(data) ? data.length : 'n/a'}`)
  log('New campaign appears in list', hasNew, campaignSlug)
}

async function testGetCampaignBySlug() {
  if (!campaignSlug) { log('Get campaign by slug', false, 'skipped — no slug'); return }
  const { status, data } = await req('GET', `/api/campaigns/${campaignSlug}`, undefined, false)
  const ok = status === 200 && data.slug === campaignSlug
  log('Get campaign by slug', ok, `status ${status}`)
}

async function testPublicSignup() {
  console.log('\n── Public waitlist signup ────────────────────────')
  if (!campaignId) { log('Public waitlist signup', false, 'skipped — no campaign ID'); return }
  const { status, data } = await req('POST', '/api/signup', {
    campaign_id: campaignId,
    email: `participant1_${Date.now()}@test.com`,
  })
  const ok = status === 200 && data.rank && data.referralCode
  log('Public signup', ok, `status ${status}`)
  if (ok) {
    referralCode = data.referralCode
    log('Rank assigned', typeof data.rank === 'number', `rank: ${data.rank}`)
    log('Referral code generated', !!referralCode, referralCode)
  } else {
    log('Signup response body', false, JSON.stringify(data))
  }
}

async function testDuplicateSignup() {
  if (!campaignId) return
  const email = `dup_${Date.now()}@test.com`
  // first signup
  await req('POST', '/api/signup', { campaign_id: campaignId, email })
  // duplicate signup
  const { status, data } = await req('POST', '/api/signup', { campaign_id: campaignId, email })
  const ok = status === 200 && data.referralCode
  log('Duplicate signup returns existing rank', ok, `status ${status}`)
}

async function testReferralSignup() {
  if (!campaignId || !referralCode) {
    log('Referral tracking', false, 'skipped — missing campaign ID or referral code')
    return
  }
  const { status, data } = await req('POST', `/api/signup?ref=${referralCode}`, {
    campaign_id: campaignId,
    email: `referred_${Date.now()}@test.com`,
    referred_by: referralCode,
  })
  const ok = status === 200 && data.rank
  log('Referral signup succeeds', ok, `status ${status}, rank: ${data.rank}`)
}

async function testInvalidSlug() {
  const { status } = await req('POST', '/api/signup', {
    campaign_id: '00000000-0000-4000-8000-000000000000',
    email: `test_${Date.now()}@test.com`,
  })
  log('Invalid slug returns 404', status === 404, `status ${status}`)
}

async function testLeaderboard() {
  console.log('\n── Leaderboard ───────────────────────────────────')
  if (!campaignId) { log('Leaderboard', false, 'skipped — no campaignId'); return }
  const { status, data } = await req('GET', `/api/leaderboard/${campaignId}`, undefined, false)
  const ok = status === 200 && Array.isArray(data)
  log('Leaderboard returns array', ok, `status ${status}, entries: ${Array.isArray(data) ? data.length : 'n/a'}`)
  if (ok && data.length > 0) {
    const sorted = data.every((item: any, i: number) =>
      i === 0 || item.rank >= data[i - 1].rank
    )
    log('Leaderboard sorted by rank ascending', sorted)
  }
}

async function testFraudAnalysis() {
  console.log('\n── AI fraud detection ────────────────────────────')
  if (!campaignId) { log('Fraud analysis', false, 'skipped — no campaignId'); return }
  const { status, data } = await req(
    'POST',
    '/api/fraud/analyze',
    { campaignId },
    true
  )
  const ok = status === 200
  log('Fraud analysis returns 200', ok, `status ${status}`)
  if (ok) {
    const hasResults = Array.isArray(data) || (data && typeof data === 'object')
    log('Fraud response is structured data', hasResults, typeof data)
    const hasReason = JSON.stringify(data).includes('reason') ||
                      JSON.stringify(data).includes('riskScore') ||
                      JSON.stringify(data).includes('flagged')
    log('Fraud response contains risk reasoning', hasReason,
      hasReason ? 'reasoning fields found' : 'no reasoning fields — may be empty dataset')
  }
}

async function testTierSuggestions() {
  console.log('\n── AI reward tier suggestions ────────────────────')
  const { status, data } = await req(
    'POST',
    '/api/campaigns/suggest-tiers',
    { description: 'A developer tool for API testing and monitoring' },
    true
  )
  const ok = status === 200
  log('Tier suggestions returns 200', ok, `status ${status}`)
  if (ok) {
    const tiers = data.tiers || data
    const hasTiers = Array.isArray(tiers) && tiers.length > 0
    log('Returns array of tiers', hasTiers, `count: ${Array.isArray(tiers) ? tiers.length : 'n/a'}`)
    if (hasTiers) {
      const hasShape = tiers[0].minReferrals !== undefined && tiers[0].rewardLabel !== undefined
      log('Tiers have correct shape (minReferrals + rewardLabel)', hasShape,
        hasShape ? `e.g. "${tiers[0].rewardLabel}" at ${tiers[0].minReferrals} referrals` : JSON.stringify(tiers[0]))
    }
  }
}

async function testBillingPage() {
  console.log('\n── Billing ───────────────────────────────────────')
  const { status, data } = await req(
    'POST',
    '/api/billing/checkout',
    {},
    true
  )
  const ok = status === 200 && (data.url || data.sessionUrl || data.checkoutUrl)
  const url = data.url || data.sessionUrl || data.checkoutUrl || ''
  log('Billing checkout creates session', ok, `status ${status}`)
  if (ok) {
    log('Checkout URL points to Stripe', url.includes('stripe.com'), url.slice(0, 60) + '...')
  } else {
    log('Billing response body', false, JSON.stringify(data))
  }
}

async function testPublicPageLoads() {
  console.log('\n── Public pages ──────────────────────────────────')
  const { status } = await req('GET', '/', undefined, false)
  log('Homepage loads (200)', status === 200, `status ${status}`)

  if (campaignSlug) {
    const { status: wStatus } = await req('GET', `/w/${campaignSlug}`, undefined, false)
    log('Public waitlist page loads (200)', wStatus === 200, `status ${wStatus}`)
  }

  const { status: loginStatus } = await req('GET', '/login', undefined, false)
  log('Login page loads (200)', loginStatus === 200, `status ${loginStatus}`)
}

// ─── run all ─────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🔥 Waitlyst smoke test`)
  console.log(`   BASE_URL: ${BASE_URL}`)
  console.log(`   Test email: ${TEST_EMAIL}`)
  console.log(`   Started: ${new Date().toISOString()}\n`)

  if (!(await preflight())) process.exit(1)

  await testSignup()
  await testLogin()
  await testWrongPassword()
  await testDashboardProtected()
  await testCreateCampaign()
  await testListCampaigns()
  await testGetCampaignBySlug()
  await testPublicSignup()
  await testDuplicateSignup()
  await testReferralSignup()
  await testInvalidSlug()
  await testLeaderboard()
  await testFraudAnalysis()
  await testTierSuggestions()
  await testBillingPage()
  await testPublicPageLoads()

  console.log('\n─────────────────────────────────────────────────')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total:  ${passed + failed}`)

  if (failed > 0) {
    console.log('\nFailed tests:')
    results
      .filter(r => !r.ok)
      .forEach(r => console.log(`  ❌ ${r.label}${r.detail ? ` — ${r.detail}` : ''}`))
  }

  console.log('\n─────────────────────────────────────────────────')
  if (failed === 0) {
    console.log('🎉 All checks passed. App is working correctly.')
  } else {
    console.log('⚠️  Some checks failed. Fix the issues above and re-run.')
    process.exit(1)
  }
}

run().catch(err => {
  console.error('\n💥 Smoke test crashed:', err)
  process.exit(1)
})
