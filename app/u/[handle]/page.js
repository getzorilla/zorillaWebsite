import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProfile, listListings } from '@/lib/store'
import { currentUser } from '@/lib/auth'
import { ListingRow, Empty } from '@/components/Listings'
import Avatar from '@/components/Avatar'
import { GithubMark, XMark } from '@/components/Icons'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { handle } = await params
  return { title: `${handle} · Zorilla` }
}

export default async function ProfilePage({ params }) {
  const { handle } = await params
  const profile = await getProfile(handle)
  if (!profile) notFound()

  const me = await currentUser()
  const listings = await listListings({ author: profile.handle, viewer: me?.handle ?? null })
  const mine = me?.handle === profile.handle

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <div className="row" style={{ gap: 16, marginBottom: 8 }}>
        <Avatar src={profile.avatar} handle={profile.handle} size={56} />
        <div>
          {/* the handle is the identity, so a display name is shown with it and
              never in place of it: otherwise a name is a free disguise */}
          <h2 className="plain" style={{ margin: 0 }}>{profile.name || `@${profile.handle}`}</h2>
          {profile.name && <div className="dim mono" style={{ fontSize: 13 }}>@{profile.handle}</div>}
        </div>
        <span className="spacer" />
        {mine && <Link href="/settings" className="btn quiet">Edit</Link>}
      </div>

      {profile.bio && <p style={{ maxWidth: '62ch' }}>{profile.bio}</p>}

      <div className="row wrap" style={{ marginBottom: 26 }}>
        {profile.links?.x && (
          <a
            className="btn icon-btn"
            href={`https://x.com/${profile.links.x}`}
            target="_blank"
            rel="noreferrer"
            title={`@${profile.links.x} on X`}
            aria-label={`@${profile.links.x} on X`}
          >
            <XMark size={13} />
          </a>
        )}
        {profile.links?.github && (
          <a
            className="btn icon-btn"
            href={`https://github.com/${profile.links.github}`}
            target="_blank"
            rel="noreferrer"
            title={`${profile.links.github} on GitHub`}
            aria-label={`${profile.links.github} on GitHub`}
          >
            <GithubMark size={14} />
          </a>
        )}
        {profile.links?.site && (
          <a className="btn quiet" href={profile.links.site} target="_blank" rel="noreferrer">
            {profile.links.site.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        )}
        {profile.wallet && <span className="tag">{profile.wallet.slice(0, 6)}…{profile.wallet.slice(-4)}</span>}
      </div>

      <h2 style={{ fontSize: 15 }}>published</h2>
      {listings.length === 0 ? (
        <Empty title="nothing published yet">
          {mine
            ? <><p>Export an automation from your app and put it here.</p><Link href="/publish" className="btn primary">Publish something</Link></>
            : <p>Nothing from {profile.handle} so far.</p>}
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
