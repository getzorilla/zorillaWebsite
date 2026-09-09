import Link from 'next/link'
import { listListings } from '@/lib/store'
import { ListingRow, Empty } from '@/components/Listings'

export const metadata = { title: 'marketplace · zorilla' }
export const dynamic = 'force-dynamic'

export default async function Marketplace({ searchParams }) {
  const params = await searchParams
  const kind = ['integration', 'automation', 'theme'].includes(params?.kind) ? params.kind : null
  const query = params?.q ?? ''
  const listings = await listListings({ kind, query })

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
      <h2>marketplace</h2>
      <p className="sub">
        Automations and integrations people have published. Downloading needs no account.
        Every listing shows what it contacts, worked out from the file itself.
      </p>

      <div className="row wrap" style={{ marginBottom: 18 }}>
        {tab('everything', null)}
        {tab('automations', 'automation')}
        {tab('integrations', 'integration')}
        {tab('themes', 'theme')}
        <span className="spacer" />
        <Link href="/publish" className="btn">publish</Link>
      </div>

      <form className="row" style={{ marginBottom: 18 }}>
        {kind && <input type="hidden" name="kind" value={kind} />}
        <input name="q" defaultValue={query} placeholder="search" />
        <button className="btn" type="submit">find</button>
      </form>

      {listings.length === 0 ? (
        <Empty title={query ? 'nothing matched' : 'nothing published yet'}>
          <p>
            {query
              ? 'Try a different word.'
              : 'Build an automation in the app, export it, and publish it here. Yours would be the first.'}
          </p>
          <Link href="/publish" className="btn primary">publish something</Link>
        </Empty>
      ) : (
        <div className="list">
          {listings.map((listing) => <ListingRow key={listing.slug} listing={listing} />)}
        </div>
      )}
    </main>
  )
}
