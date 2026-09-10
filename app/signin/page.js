import { redirect } from 'next/navigation'
import SignIn from '@/components/SignIn'
import { currentUser, googleConfigured } from '@/lib/auth'

export const metadata = { title: 'Sign in · Zorilla' }

export default async function SignInPage() {
  const user = await currentUser()
  if (user?.handle) redirect(`/u/${user.handle}`)
  if (user) redirect('/welcome')

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>Sign in</h2>
      <p className="sub">
        Only needed to publish or to keep a profile. Downloading anything from the
        marketplace needs no account at all.
      </p>
      <SignIn googleReady={googleConfigured()} />
    </main>
  )
}
