'use client'

export function SignOutButton() {
  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded bg-[#C8F135] px-4 py-3 text-[13px] font-medium text-[#080808] transition-all duration-150 hover:bg-[#d4f55a]"
    >
      Sign out
    </button>
  )
}
