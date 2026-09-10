import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import { currentUser } from '@/lib/auth'

export const metadata = { title: 'pick a handle · zorilla' }

export default async function Welcome() {
  const user = await currentUser()
  if (!user) redirect('/signin')
  if (user.handle) redirect('/settings')

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>pick a handle</h2>
      <p className="sub">
        Signed in with {user.wallet ? `the wallet ${user.wallet.slice(0, 6)}…${user.wallet.slice(-4)}` : user.email}.
      </p>
      <ProfileForm claiming profile={null} />
    </main>
  )
}
