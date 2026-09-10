import { tooMany } from '@/lib/limit'
import { readSession } from '@/lib/session'
import { owns } from '@/lib/auth'
import { getPost, savePost, removePost } from '@/lib/store'
import { slugify } from '@/lib/permissions'

// A picture travels inside the post rather than to a separate file store,
// because this site runs off a file on disk in one deployment and Postgres in
// another, and only one of those has a disk that survives. The editor shrinks
// every picture before it gets here, so the cap is a backstop.
const IMAGE_LIMIT = 500_000
const IMAGES_PER_POST = 8

function cleanImages(value) {
  if (!Array.isArray(value)) return []
  const out = []
  for (const image of value.slice(0, IMAGES_PER_POST)) {
    const src = String(image?.src ?? '')
    if (!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(src)) {
      throw new Error('A picture has to be a PNG, JPEG, WebP or GIF.')
    }
    if (src.length > IMAGE_LIMIT) throw new Error('One of those pictures is too big.')
    out.push({ id: String(image?.id ?? '').slice(0, 40) || String(out.length + 1), src, alt: String(image?.alt ?? '').slice(0, 200) })
  }
  return out
}

// A date somebody typed, kept as a date. An unreadable one is today rather
// than an error: the post is the point, not the timestamp.
function when(value) {
  const said = String(value ?? '').trim()
  if (!said) return new Date().toISOString()
  const parsed = new Date(said.length === 10 ? `${said}T12:00:00Z` : said)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

export async function POST(request) {
  const slowDown = tooMany(request, { name: 'devlog', limit: 60, windowMs: 3600000 })
  if (slowDown) return slowDown

  const session = await readSession()
  if (!owns(session)) return Response.json({ error: 'Not yours to post to.' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const title = String(body.title ?? '').trim().slice(0, 140)
  if (!title) return Response.json({ error: 'Give it a title.' }, { status: 400 })

  const slug = slugify(body.slug || title)
  if (!slug) return Response.json({ error: 'That title has no letters or numbers in it.' }, { status: 400 })

  try {
    // renaming a post moves it, so the old address stops rather than serving a
    // copy that will drift from this one
    const was = String(body.was ?? '')
    if (was && was !== slug && (await getPost(was))) await removePost(was)

    const post = await savePost({
      slug,
      title,
      summary: String(body.summary ?? '').trim().slice(0, 280),
      body: String(body.body ?? '').slice(0, 60_000),
      publishedAt: when(body.publishedAt),
      draft: Boolean(body.draft),
      images: cleanImages(body.images),
    })
    return Response.json(post)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(request) {
  const session = await readSession()
  if (!owns(session)) return Response.json({ error: 'Not yours to post to.' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const slug = String(body.slug ?? '')
  if (!slug) return Response.json({ error: 'Which post?' }, { status: 400 })

  try {
    await removePost(slug)
    return Response.json({ deleted: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
