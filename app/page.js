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
        <p className="sub">
          Node 20 and a terminal to start it once. After that it is a page in your browser.
        </p>
        <div className="grid three">
          <div className="cell">
            <h3>a computer that stays on</h3>
            <p>
              zorilla runs on your machine, so an automation set to check every ten minutes
              only checks while that machine is awake. Shut the laptop and it stops. Open it
              and it runs whatever it missed, once, and tells you how many it skipped.
            </p>
          </div>
          <div className="cell">
            <h3>a key for each service you use</h3>
            <p>
              To post to Discord you make a webhook in the channel and paste the address in
              once. To send email through Resend you paste an API key. Each one is saved under
              a name you choose, and every automation lists the names it is waiting for, like
              &quot;needs a saved key called my_resend&quot;.
            </p>
          </div>
          <div className="cell">
            <h3>a public address, only for webhooks</h3>
            <p>
              Stripe, Shopify and GitHub do not sit and wait to be asked. They send a message
              to an address when a sale or a push happens, and your machine has no address
              they can reach. Pressing <b>let the internet reach this</b> on a webhook step
              gets you one to paste into Stripe. Nothing else on your computer becomes
              reachable, and the address stops working when you stop it.
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
