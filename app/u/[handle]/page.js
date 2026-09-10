import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProfile, listListings } from '@/lib/store'
import { currentUser } from '@/lib/auth'
import { ListingRow, Empty } from '@/components/Listings'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { handle } = await params
  return { title: `${handle} · Zorilla` }
}

export default async function ProfilePage({ params }) {
  const { handle } = await params
  const profile = await getProfile(handle)
  if (!profile) notFound()

  const [listings, me] = await Promise.all([
    listListings({ author: profile.handle }),
    currentUser(),
  ])
  const mine = me?.handle === profile.handle

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <div className="row" style={{ gap: 16, marginBottom: 8 }}>
        <span className="avatar">{profile.handle[0].toUpperCase()}</span>
        <div>
          <h2 style={{ margin: 0 }}>{profile.name || profile.handle}</h2>
          <div className="dim mono" style={{ fontSize: 13 }}>@{profile.handle}</div>
        </div>
        <span className="spacer" />
        {mine && <Link href="/settings" className="btn quiet">Edit</Link>}
      </div>

      {profile.bio && <p style={{ maxWidth: '62ch' }}>{profile.bio}</p>}

      <div className="row wrap" style={{ marginBottom: 26 }}>
        {profile.links?.x && <a className="btn quiet" href={`https://x.com/${profile.links.x}`} target="_blank" rel="noreferrer">x</a>}
        {profile.links?.github && <a className="btn quiet" href={`https://github.com/${profile.links.github}`} target="_blank" rel="noreferrer">github</a>}
        {profile.links?.site && <a className="btn quiet" href={profile.links.site} target="_blank" rel="noreferrer">website</a>}
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
          {listings.map((listing) => <ListingRow key={listing.slug} listing={listing} />)}
        </div>
      )}
    </main>
  )
}
