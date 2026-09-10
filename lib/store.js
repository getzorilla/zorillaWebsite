import starters from '@/public/starters.json'
import { derivePermissions } from './permissions'
import { backend, backendKind } from './backend'

// The automations that ship with the app are listed here too, so the
// marketplace has something in it on the first day and every listing on the
// page is a file somebody can actually install.
const SHIPPED = starters.map((s) => ({
  slug: s.slug,
  kind: 'automation',
  title: s.title,
  summary: s.summary,
  authorHandle: 'zorilla',
  shipped: true,
  installs: 0,
  updatedAt: '',
  derived: derivePermissions(s.package),
  package: s.package,
}))

// One small interface over whichever backend is in use. Everything above this
// line is what ships with the app; everything below is what people publish.

export const HANDLE = /^[a-z0-9][a-z0-9_-]{1,29}$/

export { backendKind }

export async function publishingWorks() {
  return (await backend()).writes
}

export async function getProfile(handle) {
  const store = await backend()
  return store.profile(String(handle ?? '').toLowerCase())
}

export async function findProfileBy(field, value) {
  const store = await backend()
  const all = await store.profiles()
  return all.find((p) => p[field] && p[field] === value) ?? null
}

export async function listProfiles() {
  const store = await backend()
  const all = await store.profiles()
  return all.sort((a, b) => a.handle.localeCompare(b.handle))
}

export async function saveProfile(profile) {
  const store = await backend()
  const handle = String(profile.handle).toLowerCase()
  if (!HANDLE.test(handle)) throw new Error('A handle is 2 to 30 characters: letters, numbers, dashes and underscores.')
  const existing = await store.profile(handle)
  return store.putProfile({
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    name: '', bio: '', links: {}, wallet: null, email: null,
    ...existing,
    ...profile,
    handle,
  })
}

export async function claimHandle(handle, identity) {
  const store = await backend()
  const key = String(handle).toLowerCase()
  if (await store.profile(key)) throw new Error(`"${key}" is taken.`)
  return saveProfile({ handle: key, ...identity })
}

export async function listListings({ kind = null, author = null, query = '' } = {}) {
  const store = await backend()
  const published = await store.listings()
  const term = query.trim().toLowerCase()
  return [...published, ...SHIPPED]
    .filter((l) => (!kind || l.kind === kind))
    .filter((l) => (!author || l.authorHandle === author))
    .filter((l) => !term || `${l.title} ${l.summary} ${l.slug}`.toLowerCase().includes(term))
    .sort((a, b) => Number(Boolean(a.shipped)) - Number(Boolean(b.shipped))
      || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
}

export async function getListing(slug) {
  const store = await backend()
  return (await store.listing(slug)) ?? SHIPPED.find((l) => l.slug === slug) ?? null
}

export async function saveListing(listing) {
  const store = await backend()
  const existing = await store.listing(listing.slug)
  return store.putListing({
    installs: 0,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    ...existing,
    ...listing,
    updatedAt: new Date().toISOString(),
  })
}

export async function removeListing(slug) {
  const store = await backend()
  await store.dropListing(slug)
}

// Counted rather than voted on. A like next to something that can move money
// competes with the permission screen, and the permission screen is the part
// that is actually true.
export async function countInstall(slug) {
  const store = await backend()
  const listing = await store.listing(slug)
  // the shipped ones are files in the repo, so there is no counter to move
  if (!listing) return SHIPPED.some((l) => l.slug === slug) ? 0 : null
  const installs = (listing.installs ?? 0) + 1
  await store.putListing({ ...listing, installs })
  return installs
}

export async function stats() {
  const store = await backend()
  const listings = await store.listings()
  const profiles = await store.profiles()
  return {
    automations: listings.filter((l) => l.kind === 'automation').length,
    integrations: listings.filter((l) => l.kind === 'integration').length,
    themes: listings.filter((l) => l.kind === 'theme').length,
    people: profiles.length,
  }
}
