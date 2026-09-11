import Link from 'next/link'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import catalog from '@/public/catalog.json'
import Shot from '@/components/Shot'
import AgentDoc from '@/components/AgentDoc'
import Command from '@/components/Command'
import StepReference from '@/components/StepReference'

export const metadata = { title: 'Docs · Zorilla' }

const pct = (x, y, w, h) => ({ x: (x / 1280) * 100, y: (y / 760) * 100, w: (w / 1280) * 100, h: (h / 760) * 100 })

const SECTIONS = [
  ['Start here', [
    ['what-it-is', 'What Zorilla is'],
    ['install', 'Installing it'],
    ['first-automation', 'Your first automation'],
    ['sharing', 'Taking and sharing'],
  ]],
  ['How it works', [
    ['items', 'Functions and items'],
    ['triggers', 'What starts a run'],
    ['expressions', 'Values from earlier functions'],
    ['keys', 'Keys'],
    ['errors', 'When something fails'],
    ['files', 'Files'],
    ['local', 'What local means'],
  ]],
  ['Reference', [
    ['steps', 'Every function'],
    ['credentials', 'Every kind of key'],
    ['integrations', 'Writing an integration'],
    ['themes', 'Themes'],
    ['marketplace', 'Publishing'],
    ['limits', 'What it cannot do'],
  ]],
]

export default async function Docs({ searchParams }) {
  const params = await searchParams
  const forAgents = params?.for === 'agents'
  const agentText = await readFile(path.join(process.cwd(), 'public', 'zorilla.md'), 'utf8')

  if (forAgents) {
    return (
      <main className="page section" style={{ borderTop: 0 }}>
        <h2>Docs for agents</h2>
        <p className="sub" style={{ maxWidth: '70ch' }}>
          One file holding every function, every field, every rule the engine enforces, and eight
          working automations to copy from. It is generated from the same catalogue the app
          loads, so it never describes a function that does not exist. Paste it into an agent and
          ask for an automation.
        </p>
        <div className="tabs">
          <Link href="/docs" className="btn quiet">For people</Link>
          <Link href="/docs?for=agents" className="btn">For agents</Link>
        </div>
        <AgentDoc text={agentText} />
      </main>
    )
  }

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>Docs</h2>
      <div className="tabs">
        <Link href="/docs" className="btn">For people</Link>
        <Link href="/docs?for=agents" className="btn quiet">For agents</Link>
      </div>

      <div className="docs">
        <nav className="docs-side">
          {SECTIONS.map(([group, links]) => (
            <div key={group} className="stack">
              <div className="group">{group}</div>
              {links.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
            </div>
          ))}
        </nav>

        <div className="docs-main">
          <section id="what-it-is">
            <h2>What Zorilla is</h2>
            <p>
              Zorilla is an automation tool that runs on your own computer. You wire functions
              together on a canvas: something starts a run, other functions read data, decide what
              to do with it, and send it somewhere. It watches prices, reads contracts, calls
              APIs, posts to Discord and Slack, and sends email.
            </p>
            <p>
              It ships with {catalog.integrations.length} service integrations, {catalog.nodes.length} functions, and reads
              Ethereum (Solidity). It cannot sign a transaction, and there are other limits worth
              knowing before you start, listed at the end.
            </p>
          </section>

          <section id="install">
            <h2>Installing it</h2>
            <h3>What you need</h3>
            <ul>
              <li>Node 20 or newer, and a terminal to type one command into.</li>
              <li>A computer that stays on while your automations run.</li>
              <li>An account with whatever services you want to use.</li>
            </ul>
            <h3>Getting it</h3>
            <p>One command, which fetches it, starts it and opens the page:</p>
            <Command>npx github:getzorilla/zorillaApp</Command>
            <p>To keep a copy you can edit, clone it instead:</p>
            <Command>{`git clone https://github.com/getzorilla/zorillaApp
cd zorillaApp
npm install
npm start`}</Command>
            <p>
              Either way it opens at <code>http://127.0.0.1:5177</code>. There is no build step
              and no configuration file. Your workspace starts empty: nothing is installed on
              your behalf. Thirteen examples come with it, four of which run with no keys at
              all, and the empty workspace offers them.
            </p>
            <h3>Where your things live</h3>
            <p>
              Everything is under <code>~/.zorilla</code>: your automations in{' '}
              <code>workflows/</code>, run history in <code>runs/</code>, saved keys encrypted
              in <code>vault.json</code>, and anything you add yourself in{' '}
              <code>themes/</code>, <code>integrations/</code> and <code>nodes/</code>. Back up
              that folder and you have backed up everything.
            </p>
            <h3>Settings</h3>
            <table className="ref">
              <thead><tr><th>variable</th><th>what it does</th></tr></thead>
              <tbody>
                <tr><td>ZORILLA_PORT</td><td>Which port to listen on. Defaults to 5177.</td></tr>
                <tr><td>ZORILLA_HOME</td><td>Where to keep everything. Defaults to <code>~/.zorilla</code>.</td></tr>
                <tr><td>ZORILLA_PASSPHRASE</td><td>Locks the vault with a passphrase instead of a key file on the machine.</td></tr>
                <tr><td>ZORILLA_PUBLIC_URL</td><td>The address to show for webhooks when you run your own tunnel.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="first-automation">
            <h2>Your first automation</h2>
            <p>
              Two things, in order. Something that works in three clicks, then one you build
              yourself that posts the ETH price to a Discord channel. Fifteen minutes for both,
              and you need a Discord server you can make a webhook in for the second half.
            </p>

            <h3>1. Open the workspace</h3>
            <p>
              Zorilla opens on your workspace with an <b>Examples</b> folder already in it:
              the ten demos that ship with it, tagged <b>Example</b>, switched off until you
              press run. Delete any of them and they stay deleted.
            </p>
            <Shot
              src="/guide/home.png"
              alt="a Zorilla workspace with the Examples folder in it"
              spots={[
                { n: 1, ...pct(0, 44, 150, 716), say: 'automations, keys, integrations, settings' },
                { n: 2, ...pct(416, 145, 830, 33), say: 'start from nothing, bring in a file, or have an agent write it' },
                { n: 3, ...pct(17, 677, 115, 36), say: 'straight to the canvas' },
              ]}
            />

            <h3>2. Take one and press run</h3>
            <p>
              The demos are numbered, and the ones that need no keys are marked{' '}
              <b>Ready</b>. Take <b>demo09: Wallet Balance Watch</b>: it reads a wallet's
              balance on Ethereum and writes it in the log, and says something separate when
              the balance has moved since it last mentioned it. Open it and press run in the
              top right. The strip along the bottom opens the log, and the balance is in it.
            </p>
            <Shot
              src="/guide/demos.png"
              alt="the Examples folder, with the keyless demos marked Ready"
              spots={[
                { n: 1, ...pct(719, 369, 57, 20), say: 'runs with nothing set up' },
                { n: 2, ...pct(446, 371, 195, 21), say: 'open it' },
                { n: 3, ...pct(446, 111, 500, 18), say: 'what the others need first' },
              ]}
            />

            <h3>3. Give Discord somewhere to post</h3>
            <p>
              Now the one you build. In Discord, open the channel you want to post in, go to
              channel settings, integrations, webhooks, and copy the webhook address. That
              address is the secret: anyone holding it can post to that channel, so treat it
              like a password.
            </p>
            <p>
              In Zorilla, go to Keys, choose Discord, paste the address in, and name it{' '}
              <code>discord_key</code>. Press save. Zorilla checks it with Discord and writes
              down where it points, so from then on every function using that key says which
              channel it posts to instead of just showing a name.
            </p>
            <Shot
              src="/guide/keys.png"
              alt="the keys panel, with a saved Discord webhook"
              spots={[
                { n: 1, ...pct(425, 152, 93, 39), say: 'the keys you have saved' },
                { n: 2, ...pct(416, 323, 560, 231), say: 'pick the service' },
                { n: 3, ...pct(416, 597, 560, 78), say: 'the name your functions will call it by' },
              ]}
            />

            <h3>4. Put the functions on the canvas</h3>
            <p>
              Start a new automation and you get the editor. The list on the left is every
              function you can use, with services grouped one row each. Open Discord and you see
              what Discord can do. Click a function to drop it in the middle of the canvas, or
              drag it where you want it.
            </p>
            <p>
              You need three: Schedule, under starting a run. Coin price, under CoinGecko. Post
              to Discord, under Discord.
            </p>
            <Shot
              src="/guide/editor-palette.png"
              alt="the function list with Discord open"
              spots={[
                { n: 1, ...pct(10, 355, 193, 36), say: 'a service, opened' },
                { n: 2, ...pct(40, 417, 163, 36), say: 'one of its functions' },
              ]}
            />

            <h3>5. Join them up and fill them in</h3>
            <p>
              Every function has a circle on each side. Drag from the right circle of one to
              the next to join them, and items flow along that wire. Click a wire to remove it.
              Right-click anywhere for copy, paste, undo and the rest.
            </p>
            <p>
              Click a function and the panel on the right is its settings. Set the schedule to
              every 10 minutes, the coin to <code>ethereum</code>, and on the Discord function
              choose the key you saved and write the message. Double braces pull a value out of
              whatever the function before it produced.
            </p>
            <pre><code>{`ETH is \${{ $json.ethereum.usd }}`}</code></pre>
            <Shot
              src="/guide/editor-step.png"
              alt="the settings panel for a Discord function"
              spots={[
                { n: 1, ...pct(999, 281, 271, 75), say: 'which key it posts with' },
                { n: 2, ...pct(999, 369, 271, 118), say: 'the message' },
                { n: 3, ...pct(999, 622, 271, 53), say: 'what happens if it fails' },
              ]}
            />

            <h3>6. Run it, then leave it running</h3>
            <p>
              Press run. The log shows every function, what it received, what it sent, and how
              long it took. If something is wrong, that is where it says so, in words rather
              than error codes.
            </p>
            <p>
              When you are happy with it, press the switch in the top right so it reads{' '}
              <b>Live</b>. From then on it runs on its own every ten minutes, for as long as
              your computer is awake. Press <b>Share</b> to save it as a file you can send to
              somebody, naming the keys it needs and never their values.
            </p>
            <Shot
              src="/guide/editor-run.png"
              alt="the editor with the run log open"
              spots={[
                { n: 1, ...pct(936, 8, 79, 26), say: 'live, or only when you press run' },
                { n: 2, ...pct(1223, 8, 45, 28), say: 'run it now' },
                { n: 3, ...pct(0, 531, 1280, 229), say: 'every function, what it got and what it sent' },
              ]}
            />
          </section>

          <section id="sharing">
            <h2>Taking and sharing automations</h2>
            <p>
              Download one from the <a href="/marketplace">marketplace</a>, then in your
              workspace press <b>Import</b> and drop it in. Nothing is saved until
              you have read what it does.
            </p>
            <p>
              That screen lists the sites it contacts, which of your keys it asks for by name,
              whether it reads a chain, and whether it runs javascript somebody else wrote. All
              of it is worked out by walking the file rather than read from anything the author
              claimed, so a dishonest description cannot hide anything. Everything arrives
              switched off.
            </p>
            <p>
              To send one of yours the other way, open it and press <b>Share</b>. You get a file
              naming the keys it needs and never their values, so the person installing it binds
              their own keys of those names.
            </p>
          </section>

          <section id="items">
            <h2>Functions and items</h2>
            <p>
              Every function takes a list of items and hands back a list of items. An item is a
              piece of JSON: <code>{'{ json: { ... } }'}</code>. That one shape is why any function
              can feed any other one.
            </p>
            <p>
              Most functions run once per item. A price function that receives three items runs three
              times and sends three on. Functions that filter send fewer items than they got. A function
              that returns nothing at all passes its input through untouched.
            </p>
            <p>
              A function that fails sends nothing, so everything downstream of it is skipped and
              says so in the run log. Branches that do not depend on it carry on.
            </p>
          </section>

          <section id="triggers">
            <h2>What starts a run</h2>
            <p>Every automation needs exactly one function that starts it. There are four kinds.</p>
            <h4>Manual</h4>
            <p>Runs when you press run. Useful while you are building.</p>
            <h4>Schedule</h4>
            <p>
              Every so many minutes, hours or days, or once at a set time. Schedules write down
              when they last fired, so if your computer was asleep, Zorilla notices on the next
              start, runs the automation once to catch up, and tells you how many it skipped.
              There are no cron expressions.
            </p>
            <h4>Webhook</h4>
            <p>
              Runs when something sends a message to an address. On its own that address only
              works on your own machine. See <a href="#local">what local means</a> for letting
              Stripe or GitHub reach it.
            </p>
            <h4>Functions that wait</h4>
            <p>
              A new Telegram message, a new Stripe payment, a new Notion row, a new Airtable
              record. These check on a timer you set and pass on only what they have not seen
              before. What counts as seen is remembered on disk, so restarting Zorilla does not
              replay yesterday.
            </p>
          </section>

          <section id="expressions">
            <h2>Values from earlier functions</h2>
            <p>
              Anything inside double braces is evaluated as JavaScript when the function runs. Use it
              in any field.
            </p>
            <pre><code>{`{{ $json.ethereum.usd }}          the value from this item
{{ $json.amount / 100 }}          cents to pounds
{{ $items.length }}               how many items this function received
{{ $index }}                      which item this is, starting at 0
{{ $now.toISOString() }}          the time right now
{{ $creds.my_key.field }}         a field of a key this function uses`}</code></pre>
            <p>
              A field that is only an expression keeps its type, so{' '}
              <code>{'{{ $json.n * 2 }}'}</code> stays a number rather than becoming text. Mix
              it with words and you get text: <code>ETH is {'${{ $json.usd }}'}</code>.
            </p>
            <p>
              <code>$creds</code> only ever holds the keys chosen on that function. A function cannot
              reach a key it does not use.
            </p>
          </section>

          <section id="keys">
            <h2>Keys</h2>
            <p>
              A key is whatever a service needs to know it is you: an API key, a bot token, a
              webhook address. You save each one once, under a name you choose, and functions refer
              to it by that name.
            </p>
            <p>
              Keys are encrypted on your machine in <code>~/.zorilla/vault.json</code>. By
              default the lock is a key file next to it, which protects the vault against
              something reading the file alone. Set <code>ZORILLA_PASSPHRASE</code> and it is
              locked with that instead.
            </p>
            <h3>Testing one</h3>
            <p>
              Press test and Zorilla makes one cheap call to the service. It comes back either
              with a plain reason it was refused, or with where the key points: the channel a
              Discord webhook posts to, the bot a Telegram token belongs to, the workspace a
              Slack token is for. That description is shown next to the key everywhere it
              appears, and it is never the secret itself.
            </p>
            <h3>Sharing without sharing keys</h3>
            <p>
              An exported automation carries the <i>name</i> of a key, never its value. When
              somebody else installs it, that name binds to their own key of the same name. This
              is enforced when the file is written, not left to good manners.
            </p>
            <h3>What a function can reach</h3>
            <p>
              A function is handed only the keys named on it. If an automation has five functions and
              one uses your Stripe key, the other four cannot see it, and asking for it fails
              rather than quietly working.
            </p>
          </section>

          <section id="errors">
            <h2>When something fails</h2>
            <p>Services have bad minutes. Every function has two settings for that.</p>
            <h4>Try again</h4>
            <p>
              How many extra attempts before it counts as failed, and how long to wait between
              them. Two retries covers most temporary failures without you doing anything else.
            </p>
            <h4>If this function fails</h4>
            <ul>
              <li><b>Stop this branch</b>, the default. The function fails, everything after it is skipped, other branches carry on.</li>
              <li><b>Carry on with the error attached</b>. The items continue with an <code>error</code> field added, so a later function can decide what to do.</li>
              <li><b>Send it down an error wire</b>. The function grows a second, red output. Drag from it to a function that tells you about it, and you get a message on Telegram when Slack goes down.</li>
            </ul>
            <p>
              The run log keeps the last 200 runs, with the reason for each failure written out.
              Anything that came from one of your keys is stripped out of the log before it is
              stored.
            </p>
          </section>

          <section id="files">
            <h2>Files</h2>
            <p>
              An item can carry a file as well as JSON. A download keeps its bytes and its
              name rather than being mangled into text. <code>file.fromText</code> turns text
              into a file, which is how you make a CSV. <code>file.save</code> writes it into{' '}
              <code>~/.zorilla/files</code>, and <code>file.read</code> picks one up again.
            </p>
            <p>
              An email function sends whatever files the item is carrying as attachments. A function can
              only write into the files folder, so an automation you installed cannot write
              anywhere else on your machine.
            </p>
          </section>

          <section id="local">
            <h2>What local means</h2>
            <p>
              The server binds to <code>127.0.0.1</code>, which means only your own machine can
              talk to it. That is not configurable, because it holds your keys and has no login.
              If you want to reach it from another computer, forward a port over SSH.
            </p>
            <p>
              Local does not mean offline. Reading a balance calls an Ethereum endpoint. Posting
              to Discord calls Discord. Whoever runs those services sees the request, the same as
              if you had visited their website. What does not happen is any of it passing through
              a server of ours, because there is not one.
            </p>
            <h3>Letting the outside in</h3>
            <p>
              Stripe, Shopify and GitHub do not wait to be asked. They send a message to an
              address when something happens, and your machine has no address they can reach.
              Open a webhook function and press <b>Create address</b>. Zorilla fetches
              Cloudflare&apos;s tunnel program the first time, about 30MB, and gives you an
              address to hand over.
            </p>
            <p>
              A tunnel dials outward from your machine. Nothing on your computer becomes
              reachable except that one address, and it stops working when you stop it. Every
              webhook gets a secret at the same time, sent as <code>?secret=…</code> or an{' '}
              <code>X-Zorilla-Secret</code> header, so nobody who guesses the address can set
              your automation off. The address changes each time the tunnel restarts, so whoever
              you gave it to needs the new one.
            </p>
          </section>

          <section id="steps">
            <h2>Every function</h2>
            <p>
              {catalog.nodes.length} functions, generated from what the app actually loads. Functions
              marked <i>waits</i> check on a timer and pass on only what is new.
            </p>
            <StepReference />
          </section>

          <section id="credentials">
            <h2>Every kind of key</h2>
            <table className="ref">
              <thead><tr><th>kind</th><th>service</th><th>what you fill in</th></tr></thead>
              <tbody>
                {catalog.credentialTypes.map((type) => (
                  <tr key={type.type}>
                    <td>{type.type}</td>
                    <td>{type.label}</td>
                    <td>
                      {(type.fields ?? []).map((f) => f.label + (f.required === false ? ' (optional)' : '')).join(', ') || 'fields you name yourself'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section id="integrations">
            <h2>Writing an integration</h2>
            <p>
              One JSON file per service: the fields its key needs, how a request authenticates,
              and what each function sends. Nothing in it executes, so the sites it reaches can be
              read off the file before anyone installs it.
            </p>
            <p>
              You do not have to write it by hand. In Zorilla, open integrations, press{' '}
              <b>+ Create integration</b>, and copy the prompt at the top of that screen: name the
              service you want, hand it to an assistant, and paste the answer back.{' '}
              <a href="/integrations">The same prompt is here.</a>
            </p>
            <pre><code>{`{
  "id": "my_api",
  "label": "My API",
  "description": "What this service is.",
  "credential": {
    "fields": [{ "key": "apiKey", "label": "API key", "secret": true, "required": true }],
    "auth": { "headers": { "Authorization": "Bearer {{ apiKey }}" } },
    "test": { "method": "GET", "url": "https://api.example.com/me" },
    "identity": { "as": "user.name" }
  },
  "actions": [{
    "key": "send",
    "label": "Send a thing",
    "params": [{ "key": "text", "label": "Text", "type": "textarea" }],
    "request": {
      "method": "POST",
      "url": "https://api.example.com/things",
      "json": { "text": "{{ text }}" }
    },
    "errorPath": "error.message"
  }]
}`}</code></pre>
            <p>
              Two substitutions exist and no others: <code>{'{{ paramKey }}'}</code> for a value
              from the function, and <code>{'{{ key.fieldName }}'}</code> for a field of the key
              being used. Neither can reach anything else.
            </p>
            <h3>Rules enforced when you save one</h3>
            <ul>
              <li>The site a function contacts has to be written out, or be a whole address you filled in yourself. An address assembled at run time is refused, because nobody could tell what it reaches.</li>
              <li>A key travelling in a web address is called out on screen, because it ends up in logs along the route.</li>
            </ul>
            <h3>Extras</h3>
            <ul>
              <li><code>itemsPath</code> points at the list in the answer, so one call becomes one item per row.</li>
              <li><code>pagination</code> says where the next page marker lives and where it goes back in, and Zorilla keeps asking until it has what the function was told to bring back.</li>
              <li><code>trigger</code> with <code>dedupeBy</code> turns an action into a function that waits, firing only for things it has not seen.</li>
              <li><code>attachments</code> sends whatever files the item is carrying.</li>
              <li><code>icon</code> is a png, jpeg or webp pasted into the file, so a shared integration arrives with its own picture.</li>
            </ul>
            <p>
              Drop your file into <code>~/.zorilla/integrations/</code> and press refresh, or
              write it in the integrations panel.
            </p>
          </section>

          <section id="themes">
            <h2>Themes</h2>
            <p>
              13 are preloaded, including Nord, One Dark, Catppuccin, Dracula, Monokai and Tokyo
              Night from VS Code. Yours go in <code>~/.zorilla/themes/</code>, or paste one into
              the themes panel.
            </p>
            <pre><code>{`{
  "id": "my-theme",
  "label": "My theme",
  "appearance": "dark",
  "colors": { "bg": "#101013", "text": "#d8d8de", "accent": "#6ea8fe" }
}`}</code></pre>
            <p>Anything you leave out falls back to the default.</p>
          </section>

          <section id="marketplace">
            <h2>Publishing</h2>
            <p>
              Export an automation and publish it on <Link href="/marketplace">the marketplace</Link>,
              with an account made from a wallet, Phantom or Google. Nobody needs an account to
              download.
            </p>
            <p>
              What a listing says it can do is worked out by reading the file: the sites it
              contacts, the keys it needs by name, whether it reads a chain, whether it runs
              custom code. Authors do not write their own permission list, because a dishonest
              one would simply lie.
            </p>
          </section>

          <section id="limits">
            <h2>What it cannot do</h2>
            <ul>
              <li><b>Sign or send a transaction.</b> Preparing one tells you what it would do and what it would cost, and refuses anything that would fail. A person still signs.</li>
              <li><b>Loop.</b> Lists page themselves, but there is no repeat-until and no wait-then-continue.</li>
              <li><b>Cron expressions.</b> Every so many minutes, hours or days, or once at a set time.</li>
              <li><b>Keep the same public address.</b> Every tunnel restart hands out a new one.</li>
              <li><b>Run while your computer is asleep.</b> It catches up once when you open it again.</li>
            </ul>
            <p>
              The Run JavaScript function runs in a separate process with no file access, no way to
              start other programs, and nothing in its environment. It can still reach the
              network, which is what most code functions are for. Community function files under{' '}
              <code>~/.zorilla/nodes/</code> are ordinary Node code with none of those limits, so
              installing one is the same as running <code>npm install</code> on a package you
              have not read.
            </p>
          </section>

          <div className="row wrap" style={{ marginTop: 6 }}>
            <a className="btn primary" href="#install">Install it</a>
            <Link href="/marketplace" className="btn">Marketplace</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
