import { notFound } from 'next/navigation'
import { readSession } from '@/lib/session'
import { owns } from '@/lib/auth'
import DevlogEditor from '@/components/DevlogEditor'

export const metadata = { title: 'Write · Zorilla' }

export default async function NewPost() {
  const session = await readSession()
  // not a redirect to sign in: somebody who is not the owner should not learn
  // that this address means anything
  if (!owns(session)) notFound()
  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2 style={{ marginTop: 0 }}>Write</h2>
      <DevlogEditor />
    </main>
  )
}
