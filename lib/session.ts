import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-length')

export interface SessionPayload {
  founderId: string
  iat?: number
  exp?: number
}

export async function createSession(founderId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const token = await new SignJWT({ founderId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
  })

  return token
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    const verified = await jwtVerify(token, secret)
    return verified.payload as unknown as SessionPayload
  } catch (error) {
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

