import Link from 'next/link'
import { redirect } from 'next/navigation'
import PublishForm from '@/components/PublishForm'
import { publishingWorks } from '@/lib/store'
import { currentUser } from '@/lib/auth'

export const metadata = { title: 'Publish · Zorilla' }

export default async function Publish() {
  const user = await currentUser()
  if (!user) redirect('/signin')
  if (!user.handle) redirect('/welcome')

  const works = await publishingWorks()
  if (!works) {
    return (
      <main className="page section" style={{ borderTop: 0 }}>
        <h2>Publish</h2>
        <p className="sub">
          Publishing is off here. This copy of the site has nowhere to keep what people publish,
          so anything sent would be gone within the hour. Downloading the automations that ship
          with Zorilla still works.
        </p>
        <Link href="/marketplace" className="btn">Back to the marketplace</Link>
      </main>
    )
  }

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>Publish</h2>
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
