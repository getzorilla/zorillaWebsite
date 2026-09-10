import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import { currentUser } from '@/lib/auth'

export const metadata = { title: 'settings · zorilla' }

export default async function Settings() {
  const user = await currentUser()
  if (!user) redirect('/signin')
  if (!user.handle) redirect('/welcome')

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>your profile</h2>
      <p className="sub mono">
        {user.wallet ? `${user.wallet.slice(0, 6)}…${user.wallet.slice(-4)}` : user.email}
      </p>
      <ProfileForm profile={user.profile} />
    </main>
  )
}
