import Link from 'next/link'
import catalog from '@/public/catalog.json'
import { stats } from '@/lib/store'
import { ThemePreview } from '@/components/ThemeCard'
import { GithubMark } from '@/components/Icons'
import Shot from '@/components/Shot'
import UseCases from '@/components/UseCases'
import CanvasPreview from '@/components/CanvasPreview'
import CopyCommand from '@/components/CopyCommand'
import starters from '@/public/starters.json'

const CASES = [
  {
    id: 'traders', slug: 'usdc-landing-to-telegram', who: 'Traders',
    line: 'Get a Telegram message the moment USDC lands in a wallet',
    why: 'Checks every five minutes, tells you once per transaction, and never repeats itself after a restart.',
    steps: [
      'every 5 minutes',
      'contract events  USDC · Transfer · only where to = your address',
      'first time only  by transaction hash',
      'telegram  "USDC in: {{ $json.args.value }}"',
    ],
    needs: 'a Telegram bot token',
  },
  {
    id: 'influencers', slug: 'chain-news-to-x', who: 'Influencers',
    line: 'Check chain news, have Claude draft a post, put it on X',
    why: 'Half-hourly. Keeps only the headlines you care about, and never drafts the same one twice.',
    steps: [
      'every 30 minutes',
      'http request  a news feed',
      'filter  title contains "Robinhood"',
      'first time only  by article id',
      'ask claude  "write one post, under 240 characters"',
      'post to x  {{ $json.text }}',
    ],
    needs: 'a Claude key and an X access token',
  },
  {
    id: 'community', slug: 'price-move-to-discord', who: 'Communities',
    line: 'Announce a price move to Discord with @everyone',
    why: 'Checks every ten minutes but stays quiet until the price is 5% away from the last thing it told you.',
    steps: [
      'every 10 minutes',
      'coin price  ethereum in usd',
      'when this moves  by 5 percent, up or down',
      'discord  "@everyone ETH is up 6% to $4,310"',
    ],
    needs: 'a Discord webhook',
  },
  {
    id: 'selling', slug: 'payment-to-slack-and-notion', who: 'Sellers',
    line: 'Turn a Stripe payment into a Slack message and a Notion row',
    why: 'One step feeding two, so both happen from the same payment. Fires once per payment.',
    steps: ['new stripe payment', 'slack  "$49.00 from buyer@example.com"', 'notion  add a row'],
    needs: 'Stripe, Slack and Notion keys',
  },
  {
    id: 'builders', slug: 'contract-numbers-by-email', who: 'Builders',
    line: 'Read any contract on a schedule and email yourself the numbers',
    why: 'Paste a Solidity function line and it reads it. Amounts stay whole numbers the whole way.',
    steps: [
      'every day',
      'read from a contract  function totalSupply() view returns (uint256)',
      'resend  email it to you',
    ],
    needs: 'a Resend key',
  },
]

export default async function Home() {
  const counts = await stats()
  const integrations = catalog.integrations.map((i) => i.label)
  const cases = CASES.map((c) => ({
    ...c,
    preview: <CanvasPreview workflow={starters.find((s) => s.slug === c.slug)?.package} height={150} />,
  }))

  return (
    <main>
      <section className="page hero">
        <div className="hero-grid">
          <div>
            <div className="hero-name">
              <img className="mark" src="/logo.svg" alt="" width="56" height="56" />
              <h1>Zorilla</h1>
            </div>
            <ul className="hero-points">
              <li>Runs on your computer. No account, no cloud, no company in the middle.</li>
              <li>Reads Ethereum (Solidity): balances, events, any read function on any contract.</li>
              <li>{catalog.integrations.length} integrations and {catalog.nodes.length} steps built in. Write your own as JSON.</li>
              <li>Keys live in an encrypted vault on your disk and never leave it.</li>
              <li>Free, and the source is public.</li>
            </ul>
            <CopyCommand command="npx github:getzorilla/zorillaApp" />
            <div className="cta">
              <Link href="/docs" className="btn primary">Docs</Link>
              <a
                className="btn quiet"
                href="https://github.com/getzorilla/zorillaApp"
                target="_blank"
                rel="noreferrer"
              >
                <GithubMark size={15} /> Source
              </a>
            </div>
            <p className="hero-note">
              Node 20 or newer. Elastic License 2.0: read it, run it, change it, use it at
              work.
            </p>
          </div>

          <UseCases cases={cases} />
        </div>
      </section>

      <section className="page section">
        <div className="feature wide">
          <div>
            <h3>Build it by dragging</h3>
            <p>
              Services on the left, one row each. Drop a step on the canvas, drag a wire to the
              next one, and each step tells you what it still needs before it can run.
            </p>
          </div>
          <Shot src="/guide/hero-x.png" alt="the Zorilla editor building a news to X automation" tilt />
        </div>

        <div className="feature wide">
          <div>
            <h3>Keys are saved once, and say where they point</h3>
            <p>
              Paste a Discord webhook or a Resend key in, name it, and every step that uses it
              shows which channel or account it goes to. Keys are encrypted on your machine, and
              a shared automation carries the name, never the value.
            </p>
          </div>
          <Shot src="/guide/keys.png" alt="the keys panel showing where a saved key points" />
        </div>

        <div className="feature wide">
          <div>
            <h3>Run it, watch what happened</h3>
            <p>
              Press run and the log shows every step, what it received, what it sent, and why
              anything failed. When it looks right, switch it live and it runs on its own.
            </p>
          </div>
          <Shot src="/guide/editor-run.png" alt="an automation switched live, with the run log" />
        </div>
      </section>

      <section className="page section">
        <h2>What you need</h2>
        <p className="sub">
          Node 20 and a terminal to start it once. After that it is a page in your browser.
        </p>
        <div className="grid three">
          <div className="cell">
            <h3>A computer that stays on</h3>
            <p>
              Zorilla runs on your machine, so an automation set to check every ten minutes
              only checks while that machine is awake. Shut the laptop and it stops. Open it
              and it runs whatever it missed, once, and tells you how many it skipped.
            </p>
          </div>
          <div className="cell">
            <h3>A key for each service you use</h3>
            <p>
              To post to Discord you make a webhook in the channel and paste the address in
              once. To send email through Resend you paste an API key. Each one is saved under
              a name you choose, and every automation lists the names it is waiting for, like
              &quot;needs a saved key called my_resend&quot;.
            </p>
          </div>
          <div className="cell">
            <h3>A public address, only for webhooks</h3>
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
        <h2>Features</h2>
        <div className="grid two">
          <div className="cell">
            <h3>Runs where you are</h3>
            <p>
              Binds to 127.0.0.1 and holds an encrypted vault. Put it on a small rented box
              if you want it awake at 3am.
            </p>
          </div>
          <div className="cell">
            <h3>Reads Ethereum (Solidity)</h3>
            <p>
              Call any read function on any contract. Balances, ERC-20 balances at the
              token&apos;s own decimals, events, gas, ENS. Amounts stay integers end to end.
            </p>
          </div>
          <div className="cell">
            <h3>Simulates contracts before spending</h3>
            <p>
              A step works out what a transaction would do and what the fee would be, then
              refuses anything that would fail. Note: onchain transactions still require
              manual signing.
            </p>
          </div>
          <div className="cell">
            <h3>The ordinary automation half</h3>
            <p>
              Start on a schedule, on a webhook, or when something new turns up: a Telegram
              message, a Stripe payment, a Notion row. Then branch on a value, filter a list,
              reshape it, call any API, and post the result somewhere. Steps hand each other
              the same kind of item, so anything can feed anything.
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
        <h2>Themes</h2>
        <p className="sub">
          13 color themes ripped off of VS Code, plus you can build your own, or
          share and download others.
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
          <Link href="/marketplace/themes" className="btn">Themes</Link>
        </div>
      </section>

      <section className="page section">
        <h2>The marketplace</h2>
        <p className="sub">
          {counts.automations + counts.integrations > 0
            ? `${counts.automations} automations and ${counts.integrations} integrations, from ${counts.people} people.`
            : 'Nothing published yet. Build something and be the first.'}
        </p>
        <div className="grid two">
          <div className="cell">
            <h3>Permissions come from the file</h3>
            <p>
              Every listing shows the sites it contacts, the keys it needs, and whether it runs
              custom code. All of it is read out of the package itself, not written by the author.
            </p>
          </div>
          <div className="cell">
            <h3>Your keys are never in a package</h3>
            <p>
              A package names a key. On install it binds to your own key of that name. The value
              stays in your vault.
            </p>
          </div>
        </div>
        <div className="cta" style={{ marginTop: 22 }}>
          <Link href="/marketplace" className="btn">Marketplace</Link>
          <Link href="/publish" className="btn quiet">Publish</Link>
        </div>
      </section>
    </main>
  )
}
