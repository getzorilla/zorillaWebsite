import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readSession } from '@/lib/session'
import { owns } from '@/lib/auth'
import { getPost } from '@/lib/store'
import PostBody from '@/components/PostBody'

const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  return { title: post ? `${post.title} · Zorilla` : 'Devlog · Zorilla' }
}

export default async function Post({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  const session = await readSession()
  const mine = owns(session)
  // a draft is only a draft to everybody else
  if (!post || (post.draft && !mine)) notFound()

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <div className="row" style={{ marginBottom: 4 }}>
        <Link href="/devlog" className="link dim" style={{ fontSize: 12.5 }}>Devlog</Link>
        <span className="spacer" />
        {mine && <Link href={`/devlog/${post.slug}/edit`} className="btn quiet">Edit</Link>}
      </div>

      <h2 className="plain" style={{ margin: '0 0 2px' }}>{post.title}</h2>
      <p className="dim mono" style={{ margin: '0 0 22px', fontSize: 12.5 }}>
        <time dateTime={post.publishedAt}>{day(post.publishedAt)}</time>
        {post.draft && ' · draft'}
      </p>

      <PostBody text={post.body} images={post.images ?? []} />
    </main>
  )
}
