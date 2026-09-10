import { tooMany } from '@/lib/limit'
import { readSession, createSession, endSession } from '@/lib/session'
import { getProfile, saveProfile, claimHandle, deleteAccount, renameAccount, HANDLE, handleTaken } from '@/lib/store'

const AVATAR_LIMIT = 120_000

// A picture is stored as the data URI the browser produced, so there is no file
// store to run. Anything that is not a small image is refused rather than kept.
function cleanAvatar(value, fallback = null) {
  if (value === null || value === '') return null
  if (typeof value !== 'string') return fallback
  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) {
    throw new Error('A picture has to be a PNG, JPEG or WebP.')
  }
  if (value.length > AVATAR_LIMIT) throw new Error('That picture is too big. Try a smaller one.')
  return value
}

// A display name is decoration; the handle is the identity, and every page that
// shows one shows the other beside it. What still has to be taken away here is
// the characters that let a name lie about where it ends: bidi overrides that
// reverse what follows, zero-width joins that hide a word, and lookalike forms
// that normalise to something else. Without this, "vitalik" is a display name
// anybody can take.
const NAME_MAX = 40
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g
function cleanName(value, fallback = '') {
  if (value === undefined) return fallback
  return String(value)
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
}

// People paste a whole profile link as often as they type a username. Take
// either and keep the username, so the page can build the link itself.
function handleOf(value, hosts) {
  const said = String(value ?? '').trim().replace(/^@/, '')
  if (!said) return ''
  const asUrl = said.match(/^(?:https?:\/\/)?(?:www\.)?([^/]+)\/([^/?#]+)/i)
  if (asUrl && hosts.some((host) => asUrl[1].toLowerCase().endsWith(host))) return asUrl[2].slice(0, 40)
  return said.split(/[/?#]/)[0].slice(0, 40)
}

function site(value) {
  const said = String(value ?? '').trim()
  if (!said) return ''
  const withScheme = /^https?:\/\//i.test(said) ? said : `https://${said}`
  try {
    const url = new URL(withScheme)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString().slice(0, 200) : ''
  } catch {
    return ''
  }
}

const owns = (session) => {
  const wallet = (process.env.OWNER_WALLET ?? '').toLowerCase()
  const email = (process.env.OWNER_EMAIL ?? '').toLowerCase()
  if (wallet && String(session.wallet ?? '').toLowerCase() === wallet) return true
  return Boolean(email) && String(session.email ?? '').toLowerCase() === email
}

const cleanLinks = (links = {}) => ({
  x: handleOf(links.x, ['x.com', 'twitter.com']),
  github: handleOf(links.github, ['github.com']),
  site: site(links.site),
})

export async function POST(request) {
  const slowDown = tooMany(request, { name: 'profile', limit: 30, windowMs: 3600000 })
  if (slowDown) return slowDown

  const session = await readSession()
  if (!session) return Response.json({ error: 'Sign in first.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  // a wallet session is a wallet session whether it came from metamask or phantom
  const identity = session.wallet ? { wallet: session.wallet } : { email: session.email }

  try {
    if (!session.handle) {
      const handle = String(body.handle ?? '').toLowerCase()
      if (!HANDLE.test(handle)) {
        return Response.json({ error: 'A username is 2 to 30 characters: letters, numbers, dashes and underscores.' }, { status: 400 })
      }
      const mine = owns(session)
      if (!mine && handleTaken(handle)) return Response.json({ error: `"${handle}" is not available.` }, { status: 400 })
      const profile = await claimHandle(handle, {
        ...identity,
        name: cleanName(body.name),
        bio: String(body.bio ?? '').slice(0, 280),
        avatar: cleanAvatar(body.avatar),
        links: cleanLinks(body.links),
      }, { allowReserved: mine })
      await createSession({ ...session, handle: profile.handle })
      return Response.json(profile)
    }

    let existing = await getProfile(session.handle)
    if (!existing) return Response.json({ error: 'That profile no longer exists.' }, { status: 404 })

    const asked = String(body.handle ?? existing.handle).toLowerCase()
    if (asked !== existing.handle) {
      existing = await renameAccount(existing.handle, asked, { allowReserved: owns(session) })
      await createSession({ ...session, handle: existing.handle })
    }

    const profile = await saveProfile({
      handle: existing.handle,
      name: cleanName(body.name, existing.name ?? ''),
      bio: String(body.bio ?? existing.bio).slice(0, 280),
      avatar: cleanAvatar(body.avatar, existing.avatar ?? null),
      links: cleanLinks(body.links ?? existing.links),
    })
    return Response.json(profile)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

// Deleting means deleting: the profile row, everything it published, and every
// like it left. The session goes with it, so the next page load is a stranger's.
export async function DELETE(request) {
  const slowDown = tooMany(request, { name: 'delete-account', limit: 10, windowMs: 3600000 })
  if (slowDown) return slowDown

  const session = await readSession()
  if (!session) return Response.json({ error: 'Sign in first.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (session.handle && String(body.confirm ?? '').toLowerCase() !== session.handle) {
    return Response.json({ error: 'Type your username to confirm.' }, { status: 400 })
  }

  try {
    const result = session.handle ? await deleteAccount(session.handle) : { removed: 0 }
    await endSession()
    return Response.json({ deleted: true, ...result })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
