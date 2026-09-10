import Link from 'next/link'
import { readSession } from '@/lib/session'
import { owns } from '@/lib/auth'
import { listPosts } from '@/lib/store'

export const metadata = { title: 'Devlog · Zorilla' }

const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function Devlog() {
  const session = await readSession()
  const mine = owns(session)
  const posts = await listPosts({ drafts: mine })

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <div className="row" style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Devlog</h2>
        <span className="spacer" />
        {mine && <Link href="/devlog/new" className="btn">Write</Link>}
      </div>

      {posts.length === 0 && <p className="dim">Nothing written yet.</p>}

      <div className="post-list">
        {posts.map((post) => (
          <Link key={post.slug} href={`/devlog/${post.slug}`} className="post-row">
            <time dateTime={post.publishedAt}>{day(post.publishedAt)}</time>
            <div>
              <div className="post-title">
                {post.title}
                {post.draft && <span className="tag" style={{ marginLeft: 8 }}>draft</span>}
              </div>
              {post.summary && <p className="dim" style={{ margin: '3px 0 0', fontSize: 13.5 }}>{post.summary}</p>}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
