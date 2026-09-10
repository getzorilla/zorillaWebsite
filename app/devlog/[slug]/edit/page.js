import { notFound } from 'next/navigation'
import { readSession } from '@/lib/session'
import { owns } from '@/lib/auth'
import { getPost } from '@/lib/store'
import DevlogEditor from '@/components/DevlogEditor'

export const metadata = { title: 'Edit · Zorilla' }

export default async function EditPost({ params }) {
  const { slug } = await params
  const session = await readSession()
  if (!owns(session)) notFound()
  const post = await getPost(slug)
  if (!post) notFound()
  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2 style={{ marginTop: 0 }}>Edit</h2>
      <DevlogEditor post={post} />
    </main>
  )
}
