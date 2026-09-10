import Link from 'next/link'
import Shot from '@/components/Shot'

export const metadata = { title: 'guide · zorilla' }

// Percentages, measured against the 1280x760 screenshots in public/guide.
const pct = (x, y, w, h) => ({ x: (x / 1280) * 100, y: (y / 760) * 100, w: (w / 1280) * 100, h: (h / 760) * 100 })

export default function Guide() {
  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>build your first one</h2>
      <p className="sub" style={{ maxWidth: '60ch' }}>
        Check the price of ETH every ten minutes and post it to a Discord channel when it
        goes above 4000. About five minutes, and you need a Discord server you can make a
        webhook in.
      </p>

      <div className="step">
        <span className="n">1</span>
        <div>
          <h3>start it</h3>
          <p>One command. It opens on your workspace, which is every automation you have.</p>
          <pre>{`git clone https://github.com/zorilla-oss/zorillaApp
cd zorillaApp && npm install && npm start`}</pre>
          <Shot
            src="/guide/home.png"
            alt="the zorilla workspace, listing automations"
            spots={[
              { n: 1, ...pct(8, 56, 132, 130), say: 'everything lives here' },
              { n: 2, ...pct(416, 146, 122, 32), say: 'start a new one' },
              { n: 3, ...pct(440, 246, 420, 22), say: 'what an automation is waiting for' },
            ]}
          />
        </div>
      </div>

      <div className="step">
        <span className="n">2</span>
        <div>
          <h3>give Discord somewhere to post</h3>
          <p>
            In Discord: channel settings, integrations, webhooks, copy the address. In zorilla:
            keys, pick Discord, paste it, name it <code>signals_webhook</code>, save. zorilla
            checks it and writes down where it points, so later you can see it goes to #signals
            rather than guessing.
          </p>
          <Shot
            src="/guide/keys.png"
            alt="the keys panel, with a saved Discord webhook"
            spots={[
              { n: 1, ...pct(8, 92, 132, 30), say: 'keys' },
              { n: 2, ...pct(432, 358, 44, 60), say: 'pick the service' },
              { n: 3, ...pct(416, 148, 560, 50), wide: true, say: 'where it actually points' },
            ]}
          />
        </div>
      </div>

      <div className="step">
        <span className="n">3</span>
        <div>
          <h3>put the steps on the canvas</h3>
          <p>
            Services are grouped, one row each. Open Discord, then click or drag <b>Post</b> to
            drop it in. Do the same for Schedule and CoinGecko, then drag from the circle on one
            step to the next to join them up.
          </p>
          <Shot
            src="/guide/editor-palette.png"
            alt="the step list with Discord open"
            spots={[
              { n: 1, ...pct(10, 326, 194, 30), say: 'a service' },
              { n: 2, ...pct(38, 400, 166, 30), say: 'what it can do' },
            ]}
          />
        </div>
      </div>

      <div className="step">
        <span className="n">4</span>
        <div>
          <h3>fill in the Discord step</h3>
          <p>
            Click the step and the panel on the right is its settings. Pick the key you saved.
            The message can carry a value from the step before it: put it in double braces.
          </p>
          <pre>{`ETH is \${{ $json.ethereum.usd }}`}</pre>
          <Shot
            src="/guide/editor-step.png"
            alt="the settings panel for a Discord step"
            spots={[
              { n: 1, ...pct(996, 244, 274, 34), wide: true, say: 'which key' },
              { n: 2, ...pct(996, 330, 274, 92), wide: true, say: 'the message' },
              { n: 3, ...pct(996, 556, 274, 120), wide: true, say: 'what to do if it breaks' },
            ]}
          />
        </div>
      </div>

      <div className="step">
        <span className="n">5</span>
        <div>
          <h3>try it, then leave it running</h3>
          <p>
            Press run. The bar along the bottom opens the run log, which shows what each step
            got and what it sent. When you are happy, press <b>not live</b> so it says
            <b> live</b>, and it runs on its own from then on.
          </p>
          <Shot
            src="/guide/editor-run.png"
            alt="the editor with the automation switched live"
            spots={[
              { n: 1, ...pct(1226, 8, 44, 28), wide: true, say: 'run it now' },
              { n: 2, ...pct(1092, 8, 60, 28), wide: true, say: 'live or not' },
              { n: 3, ...pct(8, 712, 200, 34), say: 'the run log' },
            ]}
          />
        </div>
      </div>

      <div className="step">
        <span className="n">6</span>
        <div>
          <h3>reading a contract</h3>
          <p>
            The Web3 row has the chain steps. <b>Read from a contract</b> takes any function
            line and gives you the answer. <b>Contract events</b> watches for something
            happening, and <b>only where</b> narrows it to your own address so you get three
            events rather than a hundred thousand.
          </p>
          <pre>{`function balanceOf(address) view returns (uint256)`}</pre>
          <p>
            <b>Prepare transaction</b> works out what a transaction would do and what it would
            cost, and refuses anything that would fail. Sending still needs you to sign it
            yourself.
          </p>
        </div>
      </div>

      <div className="step">
        <span className="n">7</span>
        <div>
          <h3>when something has to call you</h3>
          <p>
            Stripe and Shopify send a message to an address when a sale happens. Drop a Webhook
            step in, press <b>let the internet reach this</b>, and paste the address it gives
            you into Stripe. It comes with a secret, so nobody else can set your automation off.
          </p>
        </div>
      </div>

      <div className="row wrap" style={{ marginTop: 10 }}>
        <Link href="/marketplace" className="btn">take one that already works</Link>
        <Link href="/docs" className="btn quiet">every step, written out</Link>
      </div>
    </main>
  )
}
