import Link from 'next/link'
import { redirect } from 'next/navigation'
import PublishForm from '@/components/PublishForm'
import { currentUser } from '@/lib/auth'

export const metadata = { title: 'publish · zorilla' }

export default async function Publish() {
  const user = await currentUser()
  if (!user) redirect('/signin')
  if (!user.handle) redirect('/welcome')

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>publish</h2>
      <p className="sub">
        Permissions on your listing are read out of the file. You cannot write your own.
      </p>
      <div className="notice">
        <b>Check the file before you publish it.</b> Export it from your app, then read it
        once so nothing personal is sitting in a step. <Link href="/marketplace">See how a
        listing looks.</Link>
      </div>
      <PublishForm />
    </main>
  )
}
