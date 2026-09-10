// Where the marketplace keeps things, decided once at startup.
//
// A file on disk is right for running it on your own machine. It is wrong on a
// host that hands every request a fresh container with an empty disk, because
// the first person to publish something would watch it disappear. So: Postgres
// when a connection string is set, a file when the disk is writable, and
// otherwise a read-only mode that still serves the automations that ship with
// Zorilla and says plainly that publishing is off.
import { mkdir, readFile, writeFile, rename, access, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'

const FILE = path.join(process.cwd(), '.data', 'store.json')
const EMPTY = { profiles: {}, listings: {}, likes: {}, posts: {} }
const URL_KEYS = ['POSTGRES_URL', 'DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']

const connectionString = () => URL_KEYS.map((k) => process.env[k]).find(Boolean) ?? null

async function diskWritable() {
  try {
    await mkdir(path.dirname(FILE), { recursive: true })
    await access(path.dirname(FILE), constants.W_OK)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------- a file

function fileBackend() {
  let cache = null
  let seen = 0

  // Keyed on the file's own timestamp: a write from another copy of this module
  // (dev reloads it per route, production may run several) has to be picked up,
  // or a profile saved by the API is invisible to the page that renders it.
  const load = async () => {
    let stamp = 0
    try {
      stamp = (await stat(FILE)).mtimeMs
    } catch {
      stamp = 0
    }
    if (cache && stamp === seen) return cache
    try {
      cache = { ...EMPTY, ...JSON.parse(await readFile(FILE, 'utf8')) }
    } catch {
      cache = structuredClone(EMPTY)
    }
    seen = stamp
    return cache
  }

  const persist = async () => {
    await mkdir(path.dirname(FILE), { recursive: true })
    const tmp = `${FILE}.tmp`
    await writeFile(tmp, JSON.stringify(cache, null, 2))
    await rename(tmp, FILE)
    seen = (await stat(FILE)).mtimeMs
  }

  return {
    kind: 'file',
    writes: true,
    async profiles() { return Object.values((await load()).profiles) },
    async profile(handle) { return (await load()).profiles[handle] ?? null },
    async putProfile(profile) {
      const data = await load()
      data.profiles[profile.handle] = profile
      await persist()
      return profile
    },
    async dropProfile(handle) {
      const data = await load()
      delete data.profiles[handle]
      for (const slug of Object.keys(data.likes)) delete data.likes[slug][handle]
      await persist()
    },
    async listings() { return Object.values((await load()).listings) },
    async listing(slug) { return (await load()).listings[slug] ?? null },
    async putListing(listing) {
      const data = await load()
      data.listings[listing.slug] = listing
      await persist()
      return listing
    },
    async dropListing(slug) {
      const data = await load()
      delete data.listings[slug]
      delete data.likes[slug]
      await persist()
    },
    // a devlog post carries its pictures inline, so the list asks for
    // everything except those: otherwise opening the index pulls every image
    // ever posted
    async posts() {
      const all = Object.values((await load()).posts)
      return all.sort((x, y) => String(y.publishedAt).localeCompare(String(x.publishedAt)))
    },
    async postList() {
      return (await this.posts()).map(({ images, body, ...rest }) => rest)
    },
    async post(slug) { return (await load()).posts[slug] ?? null },
    async putPost(post) {
      const data = await load()
      data.posts[post.slug] = post
      await persist()
      return post
    },
    async dropPost(slug) {
      const data = await load()
      delete data.posts[slug]
      await persist()
    },
    async likesFor(slugs) {
      const data = await load()
      return Object.fromEntries(slugs.map((slug) => [slug, Object.keys(data.likes[slug] ?? {}).length]))
    },
    async liked(slug, handle) {
      const data = await load()
      return Boolean(data.likes[slug]?.[handle])
    },
    async likedBy(handle) {
      const data = await load()
      return Object.keys(data.likes).filter((slug) => data.likes[slug]?.[handle])
    },
    async setLike(slug, handle, on) {
      const data = await load()
      data.likes[slug] = data.likes[slug] ?? {}
      if (on) data.likes[slug][handle] = new Date().toISOString()
      else delete data.likes[slug][handle]
      await persist()
      return Object.keys(data.likes[slug]).length
    },
  }
}

// ---------------------------------------------------------------- postgres

function sqlBackend(url) {
  let ready = null
  let sql = null

  const connect = async () => {
    if (ready) return ready
    ready = (async () => {
      const { neon } = await import('@neondatabase/serverless')
      sql = neon(url)
      await sql`create table if not exists profiles (
        handle text primary key,
        body jsonb not null,
        updated_at timestamptz not null default now()
      )`
      await sql`create table if not exists listings (
        slug text primary key,
        kind text not null,
        author text not null,
        body jsonb not null,
        updated_at timestamptz not null default now()
      )`
      await sql`create index if not exists listings_author on listings (author)`
      await sql`create table if not exists posts (
        slug text primary key,
        published_at timestamptz not null,
        draft boolean not null default false,
        title text not null,
        summary text not null default '',
        body jsonb not null
      )`
      await sql`create index if not exists posts_published on posts (published_at desc)`
      // one row per person per listing, so the count is people rather than clicks
      await sql`create table if not exists likes (
        slug text not null,
        handle text not null,
        created_at timestamptz not null default now(),
        primary key (slug, handle)
      )`
    })()
    return ready
  }

  return {
    kind: 'postgres',
    writes: true,
    async profiles() {
      await connect()
      return (await sql`select body from profiles order by handle`).map((r) => r.body)
    },
    async profile(handle) {
      await connect()
      const rows = await sql`select body from profiles where handle = ${handle}`
      return rows[0]?.body ?? null
    },
    async putProfile(profile) {
      await connect()
      await sql`insert into profiles (handle, body) values (${profile.handle}, ${JSON.stringify(profile)})
                on conflict (handle) do update set body = excluded.body, updated_at = now()`
      return profile
    },
    async dropProfile(handle) {
      await connect()
      await sql`delete from likes where handle = ${handle}`
      await sql`delete from listings where author = ${handle}`
      await sql`delete from profiles where handle = ${handle}`
    },
    async listings() {
      await connect()
      return (await sql`select body from listings order by updated_at desc`).map((r) => r.body)
    },
    async listing(slug) {
      await connect()
      const rows = await sql`select body from listings where slug = ${slug}`
      return rows[0]?.body ?? null
    },
    async putListing(listing) {
      await connect()
      await sql`insert into listings (slug, kind, author, body)
                values (${listing.slug}, ${listing.kind}, ${listing.authorHandle}, ${JSON.stringify(listing)})
                on conflict (slug) do update set kind = excluded.kind, author = excluded.author,
                  body = excluded.body, updated_at = now()`
      return listing
    },
    async dropListing(slug) {
      await connect()
      await sql`delete from listings where slug = ${slug}`
      await sql`delete from likes where slug = ${slug}`
    },
    async posts() {
      await connect()
      return (await sql`select body from posts order by published_at desc`).map((r) => r.body)
    },
    // the columns, not the jsonb, so an index page never reads the pictures
    async postList() {
      await connect()
      const rows = await sql`select slug, title, summary, draft, published_at
                             from posts order by published_at desc`
      return rows.map((r) => ({
        slug: r.slug, title: r.title, summary: r.summary, draft: r.draft,
        publishedAt: new Date(r.published_at).toISOString(),
      }))
    },
    async post(slug) {
      await connect()
      const rows = await sql`select body from posts where slug = ${slug}`
      return rows[0]?.body ?? null
    },
    async putPost(post) {
      await connect()
      await sql`insert into posts (slug, published_at, draft, title, summary, body)
                values (${post.slug}, ${post.publishedAt}, ${post.draft}, ${post.title},
                        ${post.summary}, ${JSON.stringify(post)})
                on conflict (slug) do update set published_at = excluded.published_at,
                  draft = excluded.draft, title = excluded.title,
                  summary = excluded.summary, body = excluded.body`
      return post
    },
    async dropPost(slug) {
      await connect()
      await sql`delete from posts where slug = ${slug}`
    },
    async likesFor(slugs) {
      await connect()
      if (!slugs.length) return {}
      const rows = await sql`select slug, count(*)::int as n from likes where slug = any(${slugs}) group by slug`
      const counts = Object.fromEntries(slugs.map((slug) => [slug, 0]))
      for (const row of rows) counts[row.slug] = row.n
      return counts
    },
    async liked(slug, handle) {
      await connect()
      const rows = await sql`select 1 from likes where slug = ${slug} and handle = ${handle}`
      return rows.length > 0
    },
    async likedBy(handle) {
      await connect()
      return (await sql`select slug from likes where handle = ${handle}`).map((r) => r.slug)
    },
    async setLike(slug, handle, on) {
      await connect()
      if (on) await sql`insert into likes (slug, handle) values (${slug}, ${handle}) on conflict do nothing`
      else await sql`delete from likes where slug = ${slug} and handle = ${handle}`
      const rows = await sql`select count(*)::int as n from likes where slug = ${slug}`
      return rows[0]?.n ?? 0
    },
  }
}

// ---------------------------------------------------------------- read only

function readOnlyBackend() {
  const refuse = () => {
    throw new Error('Publishing is switched off here: this deployment has nowhere to keep what you publish. Set POSTGRES_URL and it turns on.')
  }
  return {
    kind: 'read-only',
    writes: false,
    async profiles() { return [] },
    async profile() { return null },
    async putProfile() { return refuse() },
    async dropProfile() { return refuse() },
    async listings() { return [] },
    async listing() { return null },
    async putListing() { return refuse() },
    async dropListing() { return refuse() },
    async posts() { return [] },
    async postList() { return [] },
    async post() { return null },
    async putPost() { return refuse() },
    async dropPost() { return refuse() },
    async likesFor(slugs) { return Object.fromEntries(slugs.map((slug) => [slug, 0])) },
    async liked() { return false },
    async likedBy() { return [] },
    async setLike() { return refuse() },
  }
}

let chosen = null

// A database that is set but unreachable must not take the site down with it.
// The automations that ship with Zorilla are files, so they keep serving while
// publishing waits for the database to come back.
function survivable(store) {
  const guard = (name) => async (...args) => {
    try {
      return await store[name](...args)
    } catch (err) {
      console.error(`marketplace storage (${store.kind}) failed on ${name}: ${err.message}`)
      if (name.startsWith('put') || name.startsWith('drop')) {
        throw new Error('That could not be saved: the marketplace database is not answering. Try again in a minute.')
      }
      if (name === 'profile' || name === 'listing' || name === 'post') return null
      if (name === 'likesFor') return {}
      if (name === 'liked') return false
      return []
    }
  }
  return {
    kind: store.kind,
    writes: store.writes,
    profiles: guard('profiles'),
    profile: guard('profile'),
    putProfile: guard('putProfile'),
    dropProfile: guard('dropProfile'),
    listings: guard('listings'),
    listing: guard('listing'),
    putListing: guard('putListing'),
    dropListing: guard('dropListing'),
    posts: guard('posts'),
    postList: guard('postList'),
    post: guard('post'),
    putPost: guard('putPost'),
    dropPost: guard('dropPost'),
    likesFor: guard('likesFor'),
    liked: guard('liked'),
    likedBy: guard('likedBy'),
    setLike: guard('setLike'),
  }
}

export async function backend() {
  if (chosen) return chosen
  const url = connectionString()
  if (url) chosen = survivable(sqlBackend(url))
  else if (await diskWritable()) chosen = survivable(fileBackend())
  else chosen = readOnlyBackend()
  return chosen
}

export async function backendKind() {
  return (await backend()).kind
}
