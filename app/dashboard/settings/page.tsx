export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'
import { Navigation } from '@/components/navigation'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { SignOutButton } from '@/components/sign-out-button'

function PlanBadge({ plan }: { plan: string }) {
  const normalizedPlan = plan === 'pro' ? 'pro' : 'free'
  const isPro = normalizedPlan === 'pro'

  return (
    <div
      className={`inline-flex rounded px-3 py-1 ${
        isPro
          ? 'bg-[rgba(200,241,53,0.15)] border border-[rgba(200,241,53,0.3)]'
          : 'bg-[rgba(111,207,151,0.15)] border border-[rgba(111,207,151,0.3)]'
      }`}
    >
      <span
        className={`dm-mono text-[11px] uppercase font-medium ${
          isPro ? 'text-[#C8F135]' : 'text-[#6FCF97]'
        }`}
      >
        {normalizedPlan}
      </span>
    </div>
  )
}

export default async function SettingsPage() {
  const session = await getSession()
  const client = await getDbClient()

  try {
    const founderResult = await client.query(
      'SELECT name, email, plan FROM founders WHERE id = $1',
      [session?.founderId],
    )

    const founder = founderResult.rows[0] || {
      name: 'Unknown Founder',
      email: 'Unknown Email',
      plan: 'free',
    }

    return (
      <main className="relative min-h-screen bg-[#080808] text-[#F0EDE6]">
        <Navigation />
        <DashboardSidebar />

        <div className="px-4 pb-28 pt-20 md:ml-14 md:px-6 md:pb-8 lg:ml-[200px] lg:px-8">
          <div className="mx-auto max-w-[1200px] space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="instrument-serif text-[28px] sm:text-[32px]">Settings</h1>
                <p className="mt-2 text-[14px] text-[#8A8782]">Your current founder account details and plan status.</p>
              </div>
              <SignOutButton />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6 sm:p-8">
                <h2 className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide">Founder Profile</h2>
                <div className="mt-6 space-y-6">
                  <div>
                    <div className="text-[12px] uppercase text-[#5C5955]">Name</div>
                    <div className="mt-2 text-[16px] text-[#F0EDE6]">{founder.name}</div>
                  </div>
                  <div>
                    <div className="text-[12px] uppercase text-[#5C5955]">Email</div>
                    <div className="mt-2 text-[16px] text-[#F0EDE6]">{founder.email}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] p-6 sm:p-8">
                <h2 className="dm-mono text-[12px] uppercase text-[#5C5955] font-medium tracking-wide">Plan</h2>
                <div className="mt-6 space-y-4">
                  <PlanBadge plan={founder.plan || 'free'} />
                  <p className="text-[14px] leading-relaxed text-[#8A8782]">
                    {founder.plan === 'pro'
                      ? 'Pro is active on this account. Billing and upgrades are managed from the billing page.'
                      : 'You are currently on the free plan. Upgrade from the billing page when you want higher limits and AI features.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  } finally {
    await client.end()
  }
}


