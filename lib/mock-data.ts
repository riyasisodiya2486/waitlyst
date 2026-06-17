export const mockLeaderboardData = [
  { rank: 1, email: 'alex@startup.com', referrals: 42 },
  { rank: 2, email: 'jordan@tech.io', referrals: 38 },
  { rank: 3, email: 'casey@founder.co', referrals: 35 },
  { rank: 4, email: 'morgan@build.dev', referrals: 29 },
  { rank: 5, email: 'taylor@indie.app', referrals: 24 },
  { rank: 6, email: 'sam@launch.com', referrals: 21 },
  { rank: 7, email: 'riley@growth.io', referrals: 18 },
  { rank: 8, email: 'avery@ship.dev', referrals: 15 },
  { rank: 9, email: 'blake@viral.app', referrals: 12 },
  { rank: 10, email: 'quinn@scale.co', referrals: 9 },
]

export const mockFeatures = [
  {
    title: 'AI Fraud Detection',
    description: 'Machine learning powered fraud detection catches bot signups instantly',
    span: 'col-span-2 row-span-2',
  },
  {
    title: 'Viral Referrals',
    description: 'Automatic referral rewards keep signups growing exponentially',
    span: 'col-span-1 row-span-1',
  },
  {
    title: 'Live Leaderboard',
    description: 'Real-time competitive rankings drive engagement and social sharing',
    span: 'col-span-1 row-span-1',
  },
  {
    title: 'Real-time Analytics',
    description: 'Dashboard metrics update live as your waitlist grows',
    span: 'col-span-2 row-span-1',
  },
]

export const mockCampaigns = [
  {
    id: '1',
    name: 'Acme Launch',
    slug: 'acme-launch',
    signups: 2847,
    referralRate: 94,
    status: 'live',
    created: '2024-01-15',
  },
  {
    id: '2',
    name: 'ProductX Beta',
    slug: 'productx-beta',
    signups: 1203,
    referralRate: 87,
    status: 'live',
    created: '2024-01-20',
  },
  {
    id: '3',
    name: 'Early Access',
    slug: 'early-access',
    signups: 456,
    referralRate: 72,
    status: 'paused',
    created: '2024-02-01',
  },
]

export const mockFraudItems = [
  {
    email: 'suspicious@test.com',
    ip: '192.168.1.100',
    referrals: 0,
    riskScore: 85,
    reason: 'Multiple signups from same IP within 5 minutes. Unusual referral pattern.',
  },
  {
    email: 'bot@domain.net',
    ip: '10.0.0.50',
    referrals: 12,
    riskScore: 72,
    reason: 'Email domain flagged in known bot networks. Email verification failed.',
  },
  {
    email: 'unclear@email.com',
    ip: '172.16.0.1',
    referrals: 3,
    riskScore: 45,
    reason: 'Generic email pattern. IP geolocation mismatch with signup location.',
  },
]

export const mockMetrics = [
  { label: 'Total Signups', value: 2847 },
  { label: 'Active Campaigns', value: 2 },
  { label: 'Referral Rate', value: 94 },
  { label: 'Fraud Flagged', value: 3 },
]

export const mockRecentActivity = [
  { type: 'signup', email: 'alex@new.com', time: '2 minutes ago' },
  { type: 'referral', email: 'jordan@tech.io', referrals: 5, time: '5 minutes ago' },
  { type: 'signup', email: 'casey@founder.co', time: '8 minutes ago' },
  { type: 'referral', email: 'morgan@build.dev', referrals: 3, time: '12 minutes ago' },
  { type: 'signup', email: 'taylor@indie.app', time: '15 minutes ago' },
]

export const obfuscateEmail = (email: string) => {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return email
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}@${domain}`
}
