import Link from 'next/link'
import CanvasPreview from './CanvasPreview'
import LikeButton from './LikeButton'

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export function ListingRow({ listing, signedIn = false }) {
  const derived = listing.derived ?? {}
  const isAutomation = listing.kind === 'automation' && listing.package?.nodes?.length
  return (
    <Link href={`/marketplace/${listing.slug}`} className="item listing">
      <div className="grow">
        <div className="title">{listing.title}</div>
        <div className="meta">
          {listing.kind} · by {listing.authorHandle}
          {listing.shipped && ' · came with Zorilla'}
        </div>
        {listing.summary && <div className="dim" style={{ fontSize: 13, marginTop: 2 }}>{listing.summary}</div>}
        <div style={{ marginTop: 6 }}>
          {(derived.hosts ?? []).slice(0, 3).map((host) => <span key={host} className="tag">{host}</span>)}
          {(derived.credentials ?? []).map((name) => <span key={name} className="tag">key: {name}</span>)}
          {derived.runsCode && <span className="tag warn">runs custom code</span>}
        </div>
      </div>
      {isAutomation && (
        <div className="listing-preview">
          <CanvasPreview workflow={listing.package} height={92} />
        </div>
      )}
      <LikeButton slug={listing.slug} likes={listing.likes ?? 0} liked={listing.liked} signedIn={signedIn} />
    </Link>
  )
}
