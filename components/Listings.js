import Link from 'next/link'

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export function ListingRow({ listing }) {
  const derived = listing.derived ?? {}
  return (
    <Link href={`/marketplace/${listing.slug}`} className="item">
      <div className="grow">
        <div className="title">{listing.title}</div>
        <div className="meta">
          {listing.kind} · by {listing.authorHandle} · {listing.installs ?? 0} installs
        </div>
        {listing.summary && <div className="dim" style={{ fontSize: 13 }}>{listing.summary}</div>}
      </div>
      <div style={{ textAlign: 'right', maxWidth: 260 }}>
        {(derived.hosts ?? []).slice(0, 3).map((host) => <span key={host} className="tag">{host}</span>)}
        {derived.runsCode && <span className="tag warn">runs custom code</span>}
      </div>
    </Link>
  )
}
