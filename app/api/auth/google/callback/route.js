import { cookies } from 'next/headers'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { createSession } from '@/lib/session'
import { findProfileBy } from '@/lib/store'

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export async function GET(request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const jar = await cookies()
  const expected = jar.get('zorilla_state')?.value
  jar.delete('zorilla_state')
  if (!code || !state || state !== expected) {
    return Response.redirect(new URL('/signin?error=state', request.url))
  }

  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: new URL('/api/auth/google/callback', request.url).toString(),
    grant_type: 'authorization_code',
  })
  const exchanged = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  }).then((r) => r.json()).catch(() => null)

  if (!exchanged?.id_token) return Response.redirect(new URL('/signin?error=exchange', request.url))

  let claims
  try {
    const verified = await jwtVerify(exchanged.id_token, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    claims = verified.payload
  } catch {
    return Response.redirect(new URL('/signin?error=token', request.url))
  }

  const email = String(claims.email ?? '').toLowerCase()
  const profile = await findProfileBy('email', email)
  await createSession({ sub: `google:${claims.sub}`, method: 'google', email, handle: profile?.handle ?? null })
  return Response.redirect(new URL(profile ? '/settings' : '/welcome', request.url))
}
