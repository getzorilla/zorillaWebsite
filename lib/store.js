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
  updatedAt: '',
  derived: derivePermissions(s.package),
  package: s.package,
}))

// One small interface over whichever backend is in use. Everything above this
// line is what ships with the app; everything below is what people publish.

export const HANDLE = /^[a-z0-9][a-z0-9_-]{1,29}$/

// Nobody signs up as the thing that ships the app, or as anything that would
// read as staff. The name of the project is blocked anywhere in a username, not
// just on its own, so zorilla_support and realzorilla are out too.
const RESERVED = new Set([
  'official', 'admin', 'administrator', 'staff', 'team', 'support', 'help',
  'root', 'system', 'api', 'www', 'mod', 'moderator', 'security',
])
export const SHIPPED_SLUGS = new Set(SHIPPED.map((l) => l.slug))
export const handleTaken = (handle) => {
  const name = String(handle).toLowerCase()
  return RESERVED.has(name) || name.includes('zorilla')
}

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
  if (!HANDLE.test(handle)) throw new Error('A username is 2 to 30 characters: letters, numbers, dashes and underscores.')
  const existing = await store.profile(handle)
  return store.putProfile({
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    name: '', bio: '', links: {}, avatar: null, wallet: null, email: null,
    ...existing,
    ...profile,
    handle,
  })
}

export async function claimHandle(handle, identity, { allowReserved = false } = {}) {
  const store = await backend()
  const key = String(handle).toLowerCase()
  if (!allowReserved && handleTaken(key)) throw new Error(`"${key}" is not available.`)
  if (await store.profile(key)) throw new Error(`"${key}" is taken.`)
  return saveProfile({ handle: key, ...identity })
}

// A username can be changed as long as nobody holds the new one. Anything that
// pointed at the old name moves with it: what they published, and the likes they
// left. Old listing addresses keep their original spelling, so links people have
// already shared keep working.
export async function renameAccount(from, to, { allowReserved = false } = {}) {
  const store = await backend()
  const was = String(from).toLowerCase()
  const now = String(to).toLowerCase()
  if (was === now) return store.profile(was)
  if (!HANDLE.test(now)) throw new Error('A username is 2 to 30 characters: letters, numbers, dashes and underscores.')
  if (!allowReserved && handleTaken(now)) throw new Error(`"${now}" is not available.`)
  if (await store.profile(now)) throw new Error(`"${now}" is taken.`)

  const profile = await store.profile(was)
  if (!profile) throw new Error('That profile no longer exists.')

  const liked = await store.likedBy(was)
  const mine = (await store.listings()).filter((l) => l.authorHandle === was)
  for (const listing of mine) await store.putListing({ ...listing, authorHandle: now })

  const moved = await store.putProfile({ ...profile, handle: now })
  await store.dropProfile(was)
  for (const slug of liked) await store.setLike(slug, now, true)
  return moved
}

// Deleting an account takes what that account published with it, so nothing is
// left pointing at a profile page that no longer exists.
export async function deleteAccount(handle) {
  const store = await backend()
  const key = String(handle).toLowerCase()
  const profile = await store.profile(key)
  if (!profile) return { removed: 0 }
  const mine = (await store.listings()).filter((l) => l.authorHandle === key)
  for (const listing of mine) await store.dropListing(listing.slug)
  await store.dropProfile(key)
  return { removed: mine.length }
}

export async function listListings({ kind = null, author = null, query = '', viewer = null } = {}) {
  const store = await backend()
  const published = await store.listings()
  const term = query.trim().toLowerCase()
  const found = [...published, ...SHIPPED]
    .filter((l) => (!kind || l.kind === kind))
    .filter((l) => (!author || l.authorHandle === author))
    .filter((l) => !term || `${l.title} ${l.summary} ${l.slug}`.toLowerCase().includes(term))
    // published first, newest of those first; the demos keep their own numbering
    .sort((a, b) => Number(Boolean(a.shipped)) - Number(Boolean(b.shipped))
      || (a.shipped
        ? a.title.localeCompare(b.title, undefined, { numeric: true })
        : (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')))

  const counts = await store.likesFor(found.map((l) => l.slug))
  // one query for the viewer's likes, so a page of listings knows which hearts
  // are already filled in without asking per row
  const mine = viewer ? new Set(await store.likedBy(viewer)) : new Set()
  return found.map((l) => ({ ...l, likes: counts[l.slug] ?? 0, liked: mine.has(l.slug) }))
}

export async function getListing(slug) {
  const store = await backend()
  return (await store.listing(slug)) ?? SHIPPED.find((l) => l.slug === slug) ?? null
}

export async function saveListing(listing) {
  const store = await backend()
  const existing = await store.listing(listing.slug)
  return store.putListing({
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

// Likes are rows, one per person per listing, so the number on a page is that
// many accounts and nothing else. Downloads are not counted at all: the file can
// be copied out of the page, so any download number would be a guess.
export async function likeCounts(slugs) {
  const store = await backend()
  return store.likesFor(slugs)
}

export async function hasLiked(slug, handle) {
  if (!handle) return false
  const store = await backend()
  return store.liked(slug, handle)
}

export async function setLike(slug, handle, on) {
  const store = await backend()
  return store.setLike(slug, handle, Boolean(on))
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
