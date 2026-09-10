import { tooMany } from '@/lib/limit'
import { readSession } from '@/lib/session'
import { getListing, saveListing, publishingWorks } from '@/lib/store'
import { derivePermissions, describeIntegrationSubmission, describeThemeSubmission, sanitizeWorkflow, slugify } from '@/lib/permissions'

export async function POST(request) {
  const slowDown = tooMany(request, { name: 'publish', limit: 12, windowMs: 3600000 })
  if (slowDown) return slowDown

  if (!(await publishingWorks())) {
    return Response.json({ error: 'Publishing is switched off on this deployment, because there is nowhere to keep what you publish. Downloading still works.' }, { status: 503 })
  }

  const session = await readSession()
  if (!session?.handle) return Response.json({ error: 'Pick a handle before publishing.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const kind = ['integration', 'theme'].includes(body.kind) ? body.kind : 'automation'
  const title = String(body.title ?? '').trim()
  if (title.length < 3) return Response.json({ error: 'Give it a name.' }, { status: 400 })

  let pkg
  try {
    pkg = typeof body.package === 'string' ? JSON.parse(body.package) : body.package
  } catch (err) {
    return Response.json({ error: `That file is not valid JSON: ${err.message}` }, { status: 400 })
  }
  if (!pkg || typeof pkg !== 'object') return Response.json({ error: 'Paste the exported file.' }, { status: 400 })

  let derived
  let payload
  try {
    if (kind === 'integration') {
      derived = describeIntegrationSubmission(pkg)
      payload = pkg
    } else if (kind === 'theme') {
      derived = describeThemeSubmission(pkg)
      payload = {
        id: pkg.id, label: String(pkg.label ?? pkg.id).slice(0, 60),
        appearance: derived.appearance, author: String(pkg.author ?? '').slice(0, 80),
        notes: String(pkg.notes ?? '').slice(0, 200), colors: pkg.colors,
      }
    } else {
      payload = sanitizeWorkflow(pkg)
      if (!payload.nodes.length) return Response.json({ error: 'That automation has no steps in it.' }, { status: 400 })
      derived = derivePermissions(payload)
      if (derived.unknown.length) {
        return Response.json({ error: `This uses steps that are not part of zorilla: ${derived.unknown.join(', ')}` }, { status: 400 })
      }
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 })
  }

  const slug = slugify(`${session.handle}-${title}`)
  const existing = await getListing(slug)
  if (existing && existing.authorHandle !== session.handle) {
    return Response.json({ error: 'Somebody else already published under that name.' }, { status: 409 })
  }

  const listing = await saveListing({
    slug,
    kind,
    title,
    summary: String(body.summary ?? '').slice(0, 200),
    authorHandle: session.handle,
    // Worked out here from the file itself, never taken from the submission.
    derived,
    package: payload,
  })
  return Response.json(listing)
}
