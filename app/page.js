import Link from 'next/link'
import catalog from '@/public/catalog.json'
import { stats } from '@/lib/store'
import { ThemePreview } from '@/components/ThemeCard'
import { GithubMark } from '@/components/Icons'

export default async function Home() {
  const counts = await stats()
  const integrations = catalog.integrations.map((i) => i.label)

  return (
    <main>
      <section className="page hero">
        <img className="mark" src="/logo.svg" alt="" width="62" height="62" />
        <h1>automations that run on your machine</h1>
        <p className="lede">
          Fully local automation, no strings attached. Reads smart contracts, with web3
          steps built in. 15 API integrations ship with it, or build your own.
        </p>
        <div className="cta">
          <Link href="/try" className="btn primary">try the editor</Link>
          <Link href="/marketplace" className="btn">browse the marketplace</Link>
          <a
            className="btn quiet"
            href="https://github.com/zorilla-oss/zorillaApp"
            target="_blank"
            rel="noreferrer"
          >
            <GithubMark size={15} /> source
          </a>
        </div>
        <div className="install">
          <b>git clone https://github.com/zorilla-oss/zorillaApp</b>
          <span>then npm i && npm start</span>
        </div>
      </section>

      <section className="page section">
        <h2>what you need</h2>
        <p className="sub">The last one only if something has to call you.</p>
        <div className="grid three">
          <div className="cell">
            <h3>a computer you leave on</h3>
            <p>
              A laptop is fine. It runs while the laptop is awake and catches up on what it
              missed when you open it again.
            </p>
          </div>
          <div className="cell">
            <h3>an account with the services you use</h3>
            <p>
              A Discord webhook, a Resend key, a Slack token. Paste each one in once and press
              Test. Every automation says which keys it is waiting on.
            </p>
          </div>
          <div className="cell">
            <h3>one button, if something calls you</h3>
            <p>
              Stripe and Shopify call you when something happens. Press <b>let the internet
              reach this</b> on a webhook step and zorilla opens an address for it. Nothing
              else on your computer becomes reachable.
            </p>
          </div>
        </div>
      </section>

      <section className="page section">
        <h2>what it actually does</h2>
        <div className="grid three">
          <div className="cell">
            <h3>runs where you are</h3>
            <p>
              Binds to 127.0.0.1 and holds an encrypted vault. Put it on a small rented box
              if you want it awake at 3am.
            </p>
          </div>
          <div className="cell">
            <h3>reads any contract</h3>
            <p>
              Call any read function on any contract. Balances, ERC-20 balances at the
              token&apos;s own decimals, events, gas, ENS. Amounts stay integers end to end.
            </p>
          </div>
          <div className="cell">
            <h3>simulates before it spends</h3>
            <p>
              A step works out what a transaction would do and what the fee would be, then
              refuses anything that would fail. Note: onchain transactions still require
              manual signing.
            </p>
          </div>
        </div>
      </section>

      <section className="page section">
        <h2>{catalog.integrations.length} integrations, {catalog.nodes.length} steps</h2>
        <p className="sub">
          An integration is a JSON file, not code. You can read what it contacts before you
          install it.
        </p>
        <div>
          {integrations.map((name) => <span key={name} className="tag">{name}</span>)}
        </div>
      </section>

      <section className="page section">
        <h2>themes</h2>
        <p className="sub">
          13 color themes that i ripped off of vscode plus you can build your own, or
          share/download others.
        </p>
        <div className="theme-grid">
          {(catalog.themes ?? []).slice(0, 4).map((theme) => (
            <div key={theme.id} className="theme-card">
              <ThemePreview colors={theme.colors} />
              <div className="theme-foot"><strong>{theme.label}</strong><span>{theme.appearance}</span></div>
            </div>
          ))}
        </div>
        <div className="cta" style={{ marginTop: 20 }}>
          <Link href="/marketplace/themes" className="btn">all themes</Link>
        </div>
      </section>

      <section className="page section">
        <h2>the marketplace</h2>
        <p className="sub">
          {counts.automations + counts.integrations > 0
            ? `${counts.automations} automations and ${counts.integrations} integrations, from ${counts.people} people.`
            : 'Nothing published yet. Build something and be the first.'}
        </p>
        <div className="grid two">
          <div className="cell">
            <h3>permissions come from the file</h3>
            <p>
              Every listing shows the sites it contacts, the keys it needs, and whether it runs
              custom code. All of it is read out of the package itself, not written by the author.
            </p>
          </div>
          <div className="cell">
            <h3>your keys are never in a package</h3>
            <p>
              A package names a key. On install it binds to your own key of that name. The value
              stays in your vault.
            </p>
          </div>
        </div>
        <div className="cta" style={{ marginTop: 22 }}>
          <Link href="/marketplace" className="btn">open the marketplace</Link>
          <Link href="/publish" className="btn quiet">publish something</Link>
        </div>
      </section>
    </main>
  )
}
