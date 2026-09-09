import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const NAME = 'zorilla_session'
const MAX_AGE = 60 * 60 * 24 * 30

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value) throw new Error('AUTH_SECRET is not set. Put one in .env.local.')
  return new TextEncoder().encode(value)
}

export async function createSession(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())

  const jar = await cookies()
  jar.set(NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function readSession() {
  const jar = await cookies()
  const token = jar.get(NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload
  } catch {
    return null
  }
}

export async function endSession() {
  const jar = await cookies()
  jar.delete(NAME)
}

// Short-lived and single use: a signature captured elsewhere must not work here.
export async function issueNonce(nonce) {
  const jar = await cookies()
  jar.set('zorilla_nonce', nonce, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 300,
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function takeNonce() {
  const jar = await cookies()
  const value = jar.get('zorilla_nonce')?.value ?? null
  jar.delete('zorilla_nonce')
  return value
}
