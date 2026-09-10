import { readSession } from './session'
import { getProfile } from './store'

// The signed-in person, or null. A session can exist without a profile: that is
// somebody who has proved who they are but not yet chosen a username.
export async function currentUser() {
  const session = await readSession()
  if (!session) return null
  const profile = session.handle ? await getProfile(session.handle) : null
  return { ...session, profile }
}

export const googleConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
