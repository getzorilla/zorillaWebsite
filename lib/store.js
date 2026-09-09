import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'

// The whole data layer, deliberately in one file behind a small interface.
// It writes JSON to .data/store.json, which is enough to run the site and to
// build against. Moving to Postgres or Supabase later means rewriting this
// file and nothing else.

const FILE = path.join(process.cwd(), '.data', 'store.json')
const EMPTY = { profiles: {}, listings: {}, installs: {} }

let cache = null

async function load() {
  if (cache) return cache
  try {
    cache = { ...EMPTY, ...JSON.parse(await readFile(FILE, 'utf8')) }
  } catch {
    cache = structuredClone(EMPTY)
  }
  return cache
}

async function persist() {
  await mkdir(path.dirname(FILE), { recursive: true })
  const tmp = `${FILE}.tmp`
  await writeFile(tmp, JSON.stringify(cache, null, 2))
  await rename(tmp, FILE)
}

export const HANDLE = /^[a-z0-9][a-z0-9_-]{1,29}$/

export async function getProfile(handle) {
  const data = await load()
  return data.profiles[String(handle ?? '').toLowerCase()] ?? null
}

export async function findProfileBy(field, value) {
  const data = await load()
  return Object.values(data.profiles).find((p) => p[field] && p[field] === value) ?? null
}

export async function listProfiles() {
  const data = await load()
  return Object.values(data.profiles).sort((a, b) => a.handle.localeCompare(b.handle))
}

export async function saveProfile(profile) {
  const data = await load()
  const handle = profile.handle.toLowerCase()
  if (!HANDLE.test(handle)) throw new Error('A handle is 2 to 30 characters: letters, numbers, dashes and underscores.')
  const existing = data.profiles[handle]
  data.profiles[handle] = {
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    name: '', bio: '', links: {}, wallet: null, email: null,
    ...existing,
    ...profile,
    handle,
  }
  await persist()
  return data.profiles[handle]
}

export async function claimHandle(handle, identity) {
  const data = await load()
  const key = String(handle).toLowerCase()
  if (data.profiles[key]) throw new Error(`"${key}" is taken.`)
  return saveProfile({ handle: key, ...identity })
}

export async function listListings({ kind = null, author = null, query = '' } = {}) {
  const data = await load()
  const term = query.trim().toLowerCase()
  return Object.values(data.listings)
    .filter((l) => (!kind || l.kind === kind))
    .filter((l) => (!author || l.authorHandle === author))
    .filter((l) => !term || `${l.title} ${l.summary} ${l.slug}`.toLowerCase().includes(term))
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
}

export async function getListing(slug) {
  const data = await load()
  return data.listings[slug] ?? null
}

export async function saveListing(listing) {
  const data = await load()
  const existing = data.listings[listing.slug]
  data.listings[listing.slug] = {
    installs: 0,
    createdAt: new Date().toISOString(),
    ...existing,
    ...listing,
    updatedAt: new Date().toISOString(),
  }
  await persist()
  return data.listings[listing.slug]
}

export async function removeListing(slug) {
  const data = await load()
  delete data.listings[slug]
  await persist()
}

// Counted rather than voted on. A like next to something that can move money
// competes with the permission screen, and the permission screen is the part
// that is actually true.
export async function countInstall(slug) {
  const data = await load()
  const listing = data.listings[slug]
  if (!listing) return null
  listing.installs = (listing.installs ?? 0) + 1
  await persist()
  return listing.installs
}

export async function stats() {
  const data = await load()
  const listings = Object.values(data.listings)
  return {
    automations: listings.filter((l) => l.kind === 'automation').length,
    integrations: listings.filter((l) => l.kind === 'integration').length,
    people: Object.keys(data.profiles).length,
  }
}
