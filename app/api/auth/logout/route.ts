import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    await destroySession()
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json({ message: 'Failed to logout' }, { status: 500 })
  }
}
