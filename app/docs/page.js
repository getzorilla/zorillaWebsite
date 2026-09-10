import Link from 'next/link'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import Shot from '@/components/Shot'
import AgentDoc from '@/components/AgentDoc'

export const metadata = { title: 'docs · zorilla' }

const pct = (x, y, w, h) => ({ x: (x / 1280) * 100, y: (y / 760) * 100, w: (w / 1280) * 100, h: (h / 760) * 100 })

export default async function Docs({ searchParams }) {
  const params = await searchParams
  const forAgents = params?.for === 'agents'
  const text = await readFile(path.join(process.cwd(), 'public', 'zorilla.md'), 'utf8')

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>docs</h2>
      <p className="sub">
        {forAgents
          ? 'One file with every step, every field and every rule. Paste it into an agent and it can write automations that run.'
          : 'What the pieces are and where they live. If you would rather build something first, the guide walks you through one.'}
      </p>

      <div className="tabs">
        <Link href="/docs" className={`btn ${forAgents ? 'quiet' : ''}`}>for people</Link>
        <Link href="/docs?for=agents" className={`btn ${forAgents ? '' : 'quiet'}`}>for agents</Link>
      </div>

      {forAgents ? <AgentDoc text={text} /> : (
        <div className="doc-body">
          <h3>an automation</h3>
          <p>
            Steps, joined by wires. One step starts it, the rest do things in order. Each step
            hands the next one a list of items, which is why anything can feed anything.
          </p>
          <Shot
            src="/guide/editor-run.png"
            alt="three steps joined on the canvas"
            spots={[
              { n: 1, ...pct(314, 232, 210, 60), say: 'starts it' },
              { n: 2, ...pct(574, 232, 210, 60), say: 'does something' },
              { n: 3, ...pct(834, 232, 156, 82), say: 'sends it somewhere' },
            ]}
          />

          <h3>what starts one</h3>
          <p>
            A schedule, every so many minutes or once at a set time. A webhook, when something
            outside sends you a message. Or a step that waits: a new Telegram message, a new
            Stripe payment, a new Notion row. Waiting steps check on a timer and only pass on
            what they have not seen before.
          </p>

          <h3>keys</h3>
          <p>
            One per service, saved once and encrypted on your machine. A step names the key it
            uses and never carries the value, so sharing an automation never shares a key. After
            you save one, zorilla says where it points, like the channel a Discord webhook goes
            to.
          </p>
          <Shot
            src="/guide/keys.png"
            alt="a saved Discord key showing where it points"
            spots={[{ n: 1, ...pct(416, 148, 560, 50), wide: true, say: 'the channel it posts to' }]}
          />

          <h3>values from an earlier step</h3>
          <p>
            Double braces pull a value out of whatever the previous step produced. Anything
            inside them is ordinary JavaScript.
          </p>
          <pre className="doc-block">{`ETH is \${{ $json.ethereum.usd }}
{{ $json.amount / 100 }}
{{ $now.toISOString() }}`}</pre>

          <h3>integrations</h3>
          <p>
            A service and the things it can do, written as a file rather than as code. You can
            read what it contacts before installing one, and installing it runs nothing. Write
            your own under integrations, with your own picture on it.
          </p>

          <h3>chains</h3>
          <p>
            Balances, token balances at the token&apos;s own decimals, any contract read, events,
            gas and ENS names. Amounts stay whole numbers the entire way. Preparing a transaction
            tells you what it would do and what it would cost. Signing is still yours to do.
          </p>

          <h3>when something breaks</h3>
          <p>
            Every step can try again a few times. After that it can stop, carry on with the error
            attached, or send the failure down a second wire, which is how you get told about it
            somewhere else.
          </p>

          <div className="row wrap" style={{ marginTop: 24 }}>
            <Link href="/guide" className="btn primary">walk through building one</Link>
            <Link href="/docs?for=agents" className="btn quiet">the version for agents</Link>
          </div>
        </div>
      )}
    </main>
  )
}
