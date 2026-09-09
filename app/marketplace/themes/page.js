import Link from 'next/link'
import catalog from '@/public/catalog.json'
import { listListings } from '@/lib/store'
import ThemeCard from '@/components/ThemeCard'
import { ListingRow } from '@/components/Listings'

export const metadata = { title: 'themes · zorilla' }
export const dynamic = 'force-dynamic'

export default async function Themes() {
  const shipped = catalog.themes ?? []
  const published = await listListings({ kind: 'theme' })

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>themes</h2>
      <p className="sub">
        Colours for the app you run. Drop a file into <code>~/.zorilla/themes/</code> and hit
        refresh in the themes panel.
      </p>

      <p className="dim" style={{ fontSize: 13, marginTop: 26 }}>{shipped.length} already installed</p>
      <div className="theme-grid">
        {shipped.map((theme) => <ThemeCard key={theme.id} theme={theme} />)}
      </div>

      <h2 style={{ marginTop: 44 }}>shared by people</h2>
      {published.length === 0 ? (
        <p className="sub">
          Nothing yet. Copy one in the app, change the hex values,{' '}
          <Link href="/publish" style={{ color: 'var(--link)' }}>publish it</Link>.
        </p>
      ) : (
        <div className="list">
          {published.map((listing) => <ListingRow key={listing.slug} listing={listing} />)}
        </div>
      )}
    </main>
  )
}
