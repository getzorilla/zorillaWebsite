import Link from 'next/link'
import Preview from '@/components/Preview'
import { notFound } from 'next/navigation'
import { getListing, likeCounts, hasLiked } from '@/lib/store'
import { currentUser } from '@/lib/auth'
import LikeButton from '@/components/LikeButton'
import InstallButton from '@/components/InstallButton'
import { ThemePreview } from '@/components/ThemeCard'
import CanvasPreview from '@/components/CanvasPreview'

export const dynamic = 'force-dynamic'

export default async function ListingPage({ params }) {
  const { slug } = await params
  const listing = await getListing(slug)
  if (!listing) notFound()

  const [me, counts] = await Promise.all([currentUser(), likeCounts([slug])])
  const liked = await hasLiked(slug, me?.handle)

  const derived = listing.derived ?? {}
  const isAutomation = listing.kind === 'automation'
  const isTheme = listing.kind === 'theme'

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>{listing.title}</h2>
      <div className="row" style={{ gap: 12, marginBottom: 6 }}>
        <p className="sub" style={{ margin: 0 }}>
          {listing.kind} · by <Link href={`/u/${listing.authorHandle}`}>{listing.authorHandle}</Link>
          {listing.shipped && ' · came with Zorilla'}
          {listing.updatedAt ? ` · updated ${new Date(listing.updatedAt).toLocaleDateString()}` : ''}
        </p>
        <LikeButton
          slug={slug}
          likes={counts[slug] ?? 0}
          liked={liked}
          signedIn={Boolean(me?.handle)}
        />
      </div>
      {listing.summary && <p style={{ maxWidth: '62ch' }}>{listing.summary}</p>}

      {isTheme && (
        <div className="theme-card" style={{ maxWidth: 320, marginBottom: 16 }}>
          <ThemePreview colors={listing.package.colors} />
          <div className="theme-foot">
            <strong>{listing.package.label}</strong>
            <span>{listing.package.appearance}</span>
          </div>
        </div>
      )}

      {isAutomation && (
        <div style={{ marginBottom: 16 }}>
          <CanvasPreview workflow={listing.package} height={190} />
          <p className="preview-note">{listing.package.nodes?.length ?? 0} steps, drawn from the file</p>
        </div>
      )}

      <div className="panel">
        <h3>What this can do</h3>
        <p className="dim" style={{ fontSize: 12.5, marginTop: -4 }}>
          Read out of the file, not written by the author.
        </p>
        <div style={{ marginTop: 10 }}>
          {(derived.hosts ?? []).length > 0
            ? derived.hosts.map((host) => <span key={host} className="tag">contacts {host}</span>)
            : <span className="tag">contacts nothing</span>}
          {isTheme && <span className="tag">colours only, nothing runs</span>}
        {isAutomation && derived.readsChain && <span className="tag">reads ethereum</span>}
          {isAutomation && derived.buildsTransaction && <span className="tag warn">builds a transaction (does not send)</span>}
          {isAutomation && derived.runsCode && <span className="tag warn">runs custom javascript</span>}
        </div>
        {isAutomation && (derived.credentials ?? []).length > 0 && (
          <p className="dim" style={{ fontSize: 13, marginBottom: 0 }}>
            Uses your saved keys named{' '}
            {derived.credentials.map((name) => <code key={name} className="tag">{name}</code>)}
            . It binds to your own keys of those names. No key travels in the file.
          </p>
        )}
        {isAutomation && (
          <p className="dim" style={{ fontSize: 13, marginBottom: 0 }}>
            {derived.steps} steps{derived.triggers?.length ? `, started by ${derived.triggers.join(' or ')}` : ''}.
          </p>
        )}
        {!isAutomation && (derived.fields ?? []).length > 0 && (
          <p className="dim" style={{ fontSize: 13, marginBottom: 0 }}>
            You fill in {derived.fields.map((f) => f.label).join(', ')}.
          </p>
        )}
      </div>

      {isAutomation && derived.runsCode && (
        <div className="notice">
          <b>This runs javascript written by its author.</b> That code is not sandboxed. It
          runs with the same access as Zorilla itself. Read it before you install it.
        </div>
      )}

      <Preview
        title="Contents"
        text={JSON.stringify(listing.package, null, 2)}
        filename={`${listing.slug}.json`}
      />

      <div className="row wrap" style={{ marginTop: 18 }}>
        <InstallButton slug={listing.slug} title={listing.title} kind={listing.kind} />
        <Link href="/marketplace" className="btn quiet">Back</Link>
      </div>
      <p className="dim" style={{ fontSize: 13 }}>
        {isAutomation && 'Download it, then in Zorilla press add one from a file. You get a screen listing what it contacts and which keys it asks for before anything is saved.'}
        {isTheme && 'Save it into ~/.zorilla/themes/ and press refresh in the themes panel, or paste it into add from json.'}
        {listing.kind === 'integration' && 'Save it into ~/.zorilla/integrations/ and reload, or paste it into the integration editor.'}
      </p>
    </main>
  )
}
