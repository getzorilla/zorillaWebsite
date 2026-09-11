import Link from 'next/link'
import catalog from '@/public/catalog.json'
import ThemeGrid from '@/components/ThemeGrid'
import { GithubMark } from '@/components/Icons'
import LogoBelt from '@/components/LogoBelt'
import LocalDiagram from '@/components/LocalDiagram'
import ChainDiagram from '@/components/ChainDiagram'
import UseCases from '@/components/UseCases'
import CanvasPreview from '@/components/CanvasPreview'
import CopyCommand from '@/components/CopyCommand'
import starters from '@/public/starters.json'

const CASES = [
  {
    id: 'traders', slug: 'telegram-post-to-group', who: 'Traders',
    line: 'Check if a KOL posts on X, post it in your Telegram group automatically',
    why: 'Watches one account for the words you care about. Tells you once per post, and never repeats itself after a restart.',
    steps: [
      'every 10 minutes',
      'search x  from:VitalikButerin (rollup OR L2)',
      'first time only  by post id',
      'telegram  into your group, as soon as it appears',
    ],
    needs: 'an X key and a Telegram bot token',
  },
  {
    id: 'influencers', slug: 'news-to-x', who: 'Influencers',
    line: 'Watch the news on any subject, have Claude draft a post, put it on X',
    why: 'Half-hourly. You name the subject, and it never drafts the same story twice.',
    steps: [
      'every 30 minutes',
      'search hacker news  about "Robinhood Chain"',
      'first time only  by story id',
      'ask claude  "write one post, under 240 characters"',
      'post to x  {{ $json.text }}',
    ],
    needs: 'a Claude key and an X access token',
  },
  {
    id: 'community', slug: 'sol-price-moves-to-discord', who: 'Communities',
    line: 'Announce a SOL price move to Discord, and stay quiet otherwise',
    why: 'Checks every ten minutes and says nothing until the price is 5% away from the last figure it announced.',
    steps: [
      'every 10 minutes',
      'coin price  solana in usd',
      'when this moves  by 5 percent, up or down',
      'discord  "SOL is up 6% to $214"',
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
    id: 'builders', slug: 'contract-event-to-telegram', who: 'Builders',
    line: 'Smart contract fires an event, Claude says what it means, it lands in Telegram',
    why: 'Paste a Solidity event line and it decodes every field. Amounts stay whole numbers the whole way, and each transaction is only reported once.',
    steps: [
      'every 5 minutes',
      'contract events  event Transfer(address indexed from, address indexed to, uint256 value)',
      'first time only  by transaction hash',
      'ask claude  "say what happened in one line, keep the numbers exact"',
      'telegram  into your group',
    ],
    needs: 'a Claude key and a Telegram bot token',
  },
]

export default async function Home() {
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
              <li>Fully local.</li>
              <li>
                Plug in any service/API fully encrypted (Bring Your Own Key).{' '}
                {catalog.integrations.length} integrations built in.
              </li>
              <li>Visual editor + readable as JSON.</li>
              <li>Reads and executes smart contracts (Solidity).</li>
              <li>Agent tooling provided so your agent can build on Zorilla end-to-end.</li>
              <li>Fully open source!</li>
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
            <p className="hero-note">Node 20 or newer.</p>
          </div>

          <UseCases cases={cases} />
        </div>
      </section>

      <section className="page belt-section">
        <h2>Plug in a service, or build your own integration</h2>
        <p className="sub">
          {catalog.integrations.length} integrations built in, or you can build your own
          easily with the <Link href="/integrations" className="inline-link">agent prompt</Link>.
        </p>
        <LogoBelt services={catalog.integrations} />
        <div className="cta" style={{ marginTop: 26 }}>
          <Link href="/integrations" className="btn">Integrations</Link>
        </div>
      </section>

      <section className="page tall" id="local">
        <div className="tall-head">
          <h2>Fully local</h2>
          <p className="sub">
            The engine, your automations, your keys and your run history are files on your
            machine. Accounts are only required if you want to publish content on the
            marketplace. Zorilla will never see your workspace otherwise.
          </p>
        </div>
        <LocalDiagram />
      </section>

      <section className="page tall" id="onchain">
        <div className="tall-head">
          <h2>Reads Ethereum (Solidity)</h2>
          <p className="sub">
            Balances, ERC-20 balances at the token&apos;s own decimals, events, gas and ENS, on
            mainnet or Sepolia. Any read function on any contract.
          </p>
        </div>
        <ChainDiagram />
      </section>

      <section className="page section">
        <h2>What you need</h2>
        <ul className="needs">
          <li>Node 20 or newer.</li>
          <li>
            A computer that stays on, or a server you host and reach over SSH.
          </li>
          <li>
            <b>BYOK (Bring Your Own Key).</b> Your own API keys for any external service you want integrated.
          </li>
          <li>
            <b>A public address, only for webhooks.</b> Stripe, Shopify and GitHub push to an
            address instead of waiting to be asked, so a webhook step can open one for you,
            and closing it takes the address away again.
          </li>
        </ul>
      </section>

      <section className="page section">
        <h2>Themes</h2>
        <p className="sub">
          {(catalog.themes ?? []).length} color themes I ripped off of VS Code, plus you can build your own, or
          share and download from the{' '}
          <Link href="/marketplace" className="inline-link">marketplace</Link>.
        </p>
        <ThemeGrid themes={catalog.themes ?? []} />
        <div className="cta" style={{ marginTop: 20 }}>
          <Link href="/marketplace?kind=theme" className="btn">Themes on the marketplace</Link>
        </div>
      </section>

      <section className="page section">
        <h2>Marketplace</h2>
        <p className="sub">
          User-published automations, themes, and integrations. I threw in a couple boilerplate
          automations you can start off with in there.
        </p>
        <div className="cta" style={{ marginTop: 22 }}>
          <Link href="/marketplace" className="btn">Marketplace</Link>
          <Link href="/publish" className="btn quiet">Publish</Link>
        </div>
      </section>

      <section className="page section">
        <h2>What&apos;s next</h2>
        <p className="sub">
          Zorilla is brand new (v0.1.0). While I spent time polishing it, things are bound to go
          wrong. If you run into any bugs or have any feedback in general please reach out to me
          on <a className="inline-link" href="https://x.com/4aykk" target="_blank" rel="noreferrer">X</a>.
          Currently working on private in-house cloud and infrastructure for hosting automations,
          Rust (Solana support), and general quality-of-life features.
        </p>
      </section>
    </main>
  )
}
