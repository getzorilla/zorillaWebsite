import { readSession, createSession } from '@/lib/session'
import { getProfile, saveProfile, claimHandle, HANDLE } from '@/lib/store'

export async function POST(request) {
  const session = await readSession()
  if (!session) return Response.json({ error: 'Sign in first.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const identity = session.method === 'wallet' ? { wallet: session.wallet } : { email: session.email }

  try {
    if (!session.handle) {
      const handle = String(body.handle ?? '').toLowerCase()
      if (!HANDLE.test(handle)) return Response.json({ error: 'A handle is 2 to 30 characters: letters, numbers, dashes and underscores.' }, { status: 400 })
      const profile = await claimHandle(handle, {
        ...identity,
        name: String(body.name ?? '').slice(0, 60),
        bio: String(body.bio ?? '').slice(0, 280),
        links: body.links ?? {},
      })
      await createSession({ ...session, handle: profile.handle })
      return Response.json(profile)
    }

    const existing = await getProfile(session.handle)
    if (!existing) return Response.json({ error: 'That profile no longer exists.' }, { status: 404 })
    const profile = await saveProfile({
      handle: existing.handle,
      name: String(body.name ?? existing.name).slice(0, 60),
      bio: String(body.bio ?? existing.bio).slice(0, 280),
      links: body.links ?? existing.links,
    })
    return Response.json(profile)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
