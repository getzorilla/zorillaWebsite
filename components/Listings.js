import Link from 'next/link'
import CanvasPreview from './CanvasPreview'
import LikeButton from './LikeButton'
import Avatar from './Avatar'

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

const kindLabel = (kind) => ({ automation: 'Automation', integration: 'Integration', theme: 'Theme' }[kind] ?? kind)

export function ListingRow({ listing, signedIn = false }) {
  const derived = listing.derived ?? {}
  const isAutomation = listing.kind === 'automation' && listing.package?.nodes?.length
  return (
    <Link href={`/marketplace/${listing.slug}`} className="item listing">
      <div className="grow">
        <div className="title">{listing.title}</div>
        <div className="meta by">
          <Avatar src={listing.author?.avatar} handle={listing.authorHandle} size={18} />
          <span>{listing.author?.name || listing.authorHandle}</span>
          <span className="dimmer">@{listing.authorHandle}</span>
          <span className="dimmer">· {kindLabel(listing.kind)}</span>
          {listing.shipped && <span className="dimmer">· Came with Zorilla</span>}
        </div>
        {listing.summary && <div className="dim" style={{ fontSize: 13, marginTop: 2 }}>{listing.summary}</div>}
        <div style={{ marginTop: 6 }}>
          {(derived.hosts ?? []).slice(0, 3).map((host) => <span key={host} className="tag">{host}</span>)}
          {(derived.credentials ?? []).map((name) => <span key={name} className="tag">key: {name}</span>)}
          {derived.runsCode && <span className="tag warn">Runs custom code</span>}
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
