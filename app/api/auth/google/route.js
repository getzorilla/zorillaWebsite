import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { googleConfigured } from '@/lib/auth'

export async function GET(request) {
  if (!googleConfigured()) {
    return Response.json({ error: 'Google sign-in is not configured on this deployment.' }, { status: 501 })
  }
  const state = randomBytes(16).toString('hex')
  const jar = await cookies()
  jar.set('zorilla_state', state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID)
  url.searchParams.set('redirect_uri', new URL('/api/auth/google/callback', request.url).toString())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email')
  url.searchParams.set('state', state)
  return Response.redirect(url.toString())
}
