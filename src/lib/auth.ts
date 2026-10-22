import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

const COOKIE_NAME = 'klar_session'
const SESSION_DAYS = 14

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET is not configured')
  }
  return new TextEncoder().encode(secret)
}

export type SessionUser = {
  id: string
  email: string
  name: string | null
  hasGeminiKey: boolean
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  const userId = await verifySessionToken(token)
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      geminiApiKeyEncrypted: true,
    },
  })
  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    hasGeminiKey: Boolean(user.geminiApiKeyEncrypted),
  }
}

export async function requireUserFromRequest(
  req: NextRequest,
): Promise<{ userId: string } | NextResponse> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = await verifySessionToken(token)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { userId }
}

export async function getUserGeminiKey(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKeyEncrypted: true },
  })
  if (!user?.geminiApiKeyEncrypted) return null
  const { decryptSecret } = await import('./crypto')
  return decryptSecret(user.geminiApiKeyEncrypted)
}
