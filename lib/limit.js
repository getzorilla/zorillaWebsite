// A small guard on the routes that write something. It counts requests per
// address in memory, which is enough to stop a script hammering publish or
// burning through sign-in nonces. It is not a defence against a real flood:
// that belongs in front of the site, at the host.
const buckets = new Map()

export function clientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function tooMany(request, { name, limit, windowMs }) {
  const key = `${name}:${clientKey(request)}`
  const now = Date.now()
  const seen = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  seen.push(now)
  buckets.set(key, seen)

  // keep the map from growing forever on a long-lived process
  if (buckets.size > 5000) {
    for (const [k, times] of buckets) {
      if (!times.length || now - times[times.length - 1] > windowMs) buckets.delete(k)
    }
  }

  if (seen.length <= limit) return null
  const waitSeconds = Math.ceil((windowMs - (now - seen[0])) / 1000)
  return Response.json(
    { error: `That is a lot of requests at once. Try again in ${waitSeconds} seconds.` },
    { status: 429, headers: { 'retry-after': String(waitSeconds) } },
  )
}
