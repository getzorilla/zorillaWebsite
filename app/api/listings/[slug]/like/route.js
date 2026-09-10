import { tooMany } from '@/lib/limit'
import { readSession } from '@/lib/session'
import { getListing, hasLiked, likeCounts, setLike } from '@/lib/store'

export async function GET(request, { params }) {
  const { slug } = await params
  const session = await readSession()
  const counts = await likeCounts([slug])
  return Response.json({
    likes: counts[slug] ?? 0,
    liked: await hasLiked(slug, session?.handle),
  })
}

export async function POST(request, { params }) {
  const slowDown = tooMany(request, { name: 'like', limit: 120, windowMs: 3600000 })
  if (slowDown) return slowDown

  const session = await readSession()
  if (!session?.handle) {
    return Response.json({ error: 'Pick a username first, then you can like things.' }, { status: 401 })
  }

  const { slug } = await params
  if (!(await getListing(slug))) return Response.json({ error: 'No such listing.' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const on = body.liked !== false
  const likes = await setLike(slug, session.handle, on)
  return Response.json({ likes, liked: on })
}
