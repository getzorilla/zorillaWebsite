// Where the marketplace keeps things, decided once at startup.
//
// A file on disk is right for running it on your own machine. It is wrong on a
// host that hands every request a fresh container with an empty disk, because
// the first person to publish something would watch it disappear. So: Postgres
// when a connection string is set, a file when the disk is writable, and
// otherwise a read-only mode that still serves the automations that ship with
// zorilla and says plainly that publishing is off.
import { mkdir, readFile, writeFile, rename, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'

const FILE = path.join(process.cwd(), '.data', 'store.json')
const EMPTY = { profiles: {}, listings: {} }
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

  const load = async () => {
    if (cache) return cache
    try {
      cache = { ...EMPTY, ...JSON.parse(await readFile(FILE, 'utf8')) }
    } catch {
      cache = structuredClone(EMPTY)
    }
    return cache
  }

  const persist = async () => {
    await mkdir(path.dirname(FILE), { recursive: true })
    const tmp = `${FILE}.tmp`
    await writeFile(tmp, JSON.stringify(cache, null, 2))
    await rename(tmp, FILE)
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
      await persist()
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
    async listings() { return [] },
    async listing() { return null },
    async putListing() { return refuse() },
    async dropListing() { return refuse() },
  }
}

let chosen = null

export async function backend() {
  if (chosen) return chosen
  const url = connectionString()
  if (url) chosen = sqlBackend(url)
  else if (await diskWritable()) chosen = fileBackend()
  else chosen = readOnlyBackend()
  return chosen
}

export async function backendKind() {
  return (await backend()).kind
}
