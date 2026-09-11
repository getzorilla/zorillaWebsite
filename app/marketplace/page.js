import Link from 'next/link'
import { listListings, searchProfiles } from '@/lib/store'
import { currentUser } from '@/lib/auth'
import { ListingRow, Empty } from '@/components/Listings'
import Avatar from '@/components/Avatar'

export const metadata = { title: 'Marketplace · Zorilla' }
export const dynamic = 'force-dynamic'

export default async function Marketplace({ searchParams }) {
  const params = await searchParams
  const kind = ['integration', 'automation', 'theme'].includes(params?.kind) ? params.kind : null
  const query = params?.q ?? ''
  const me = await currentUser()
  const listings = await listListings({ kind, query, viewer: me?.handle ?? null })
  const people = kind ? [] : await searchProfiles(query)

  const tab = (label, value) => (
    <Link
      key={label}
      href={value ? `/marketplace?kind=${value}` : '/marketplace'}
      className={`btn ${kind === value ? '' : 'quiet'}`}
    >
      {label}
    </Link>
  )

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>Marketplace</h2>
      <div className="row wrap" style={{ marginBottom: 18 }}>
        {tab('Everything', null)}
        {tab('Automations', 'automation')}
        {tab('Integrations', 'integration')}
        {tab('Themes', 'theme')}
        <span className="spacer" />
        <Link href="/publish" className="btn">Publish</Link>
      </div>

      <p className="footnote">Note: downloading doesn&apos;t require an account, only publishing does.</p>

      <form className="row" style={{ marginBottom: 18 }}>
        {kind && <input type="hidden" name="kind" value={kind} />}
        <input name="q" defaultValue={query} placeholder="Search automations, integrations, themes or people" />
        <button className="btn icon-btn" type="submit" aria-label="search" title="Search">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
        </button>
      </form>

      {people.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <p className="footnote" style={{ marginBottom: 10 }}>People</p>
          <div className="row wrap">
            {people.map((person) => (
              <Link key={person.handle} href={`/u/${person.handle}`} className="item person">
                <Avatar src={person.avatar} handle={person.handle} size={32} />
                <span className="grow">
                  <span className="title">{person.name || person.handle}</span>
                  <span className="dimmer"> @{person.handle}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {listings.length === 0 && people.length === 0 ? (
        <Empty title={query ? 'Nothing matched' : 'Nothing published yet'}>
          <p>
            {query
              ? 'Try a different word.'
              : 'Build an automation in the app, export it, and publish it here. Yours would be the first.'}
          </p>
          <Link href="/publish" className="btn primary">Publish something</Link>
        </Empty>
      ) : (
        <div className="list">
          {listings.map((listing) => (
            <ListingRow key={listing.slug} listing={listing} signedIn={Boolean(me?.handle)} />
          ))}
        </div>
      )}
    </main>
  )
}
