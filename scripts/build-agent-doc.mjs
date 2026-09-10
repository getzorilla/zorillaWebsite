// Writes public/zorilla.md: everything an agent needs to write a working
// zorilla automation, generated from the same catalogue the app loads, so it
// cannot drift from what the steps actually take.
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = process.env.ZORILLA_APP ?? path.join(here, '../../zorillaApp')
const catalog = JSON.parse(await readFile(path.join(here, '../public/catalog.json'), 'utf8'))

const out = []
const w = (...lines) => out.push(...lines)

w('# zorilla, for agents',
  '',
  'zorilla runs automations on one person\'s own machine. An automation is a JSON file:',
  'steps, and wires between them. This file lists every step, what it takes, and the rules',
  'the engine enforces. It is generated from the running catalogue.',
  '',
  `Steps: ${catalog.nodes.length}. Integrations: ${catalog.integrations.length}. Generated ${catalog.generatedAt.slice(0, 10)}.`,
  '',
  '## The file',
  '',
  '```json',
  JSON.stringify({
    name: 'eth price to discord',
    folder: 'examples',
    active: false,
    nodes: [
      { id: 'clock', type: 'core.schedule', params: { mode: 'every', every: 10, unit: 'minutes' }, position: { x: 60, y: 200 } },
      { id: 'price', type: 'coingecko.price', params: { ids: 'ethereum', currency: 'usd' }, position: { x: 330, y: 200 } },
      { id: 'post', type: 'discord.post', params: { credential: 'signals_webhook', content: 'ETH ${{ $json.ethereum.usd }}' }, position: { x: 600, y: 200 } },
    ],
    edges: [
      { from: 'clock', fromPort: 'main', to: 'price', toPort: 'main' },
      { from: 'price', fromPort: 'main', to: 'post', toPort: 'main' },
    ],
  }, null, 2),
  '```',
  '',
  '## Rules',
  '',
  '- Every step takes a list of items and returns a list of items. An item is `{ "json": { ... } }`, and may also carry `binary` for files.',
  '- A step returning nothing passes its input through.',
  '- Cycles are refused before a run starts. There is no loop step.',
  '- Exactly one step should have category `trigger`. Without one, nothing starts.',
  '- `{{ ... }}` in any parameter is JavaScript over `$json` (this item), `$items`, `$index`, `$now`, `$creds`.',
  '- A parameter that is only an expression keeps its type: `{{ $json.n * 2 }}` stays a number.',
  '- A step receives only the keys named on it. `$creds` holds nothing else.',
  '- Amounts from chain steps are integers, handed on as strings. Do not put them through a float.',
  '- Every step may set `retries` (0-5), `retryWait` (milliseconds) and `onError`: `stop`, `continue`, or `errorOutput`. With `errorOutput` the step grows a second port named `error` carrying `{ error, step, at }`.',
  '- Steps that read a list keep asking for pages until they have `limit` items, and say in the log whether more were left.',
  '- Steps whose category is `trigger` and which poll (marked below) fire on their own timer and pass on only what they have not seen before.',
  '',
  '## Keys',
  '',
  'A step names a key; it never carries the value. The person installing it binds that name',
  'to their own saved key. Use plain names like `my_slack`, `signals_webhook`.',
  '')

const byService = new Map()
for (const node of catalog.nodes) {
  const key = node.integration ?? node.category
  if (!byService.has(key)) byService.set(key, [])
  byService.get(key).push(node)
}

const paramLine = (p) => {
  const bits = [`\`${p.key}\``, p.type]
  if (p.default !== undefined && p.default !== '' && !Array.isArray(p.default)) bits.push(`default ${JSON.stringify(p.default)}`)
  if (p.options?.length) bits.push(`one of: ${p.options.map((o) => (o.value ?? o)).join(', ')}`)
  if (p.credentialType) bits.push(`a saved ${p.credentialType} key`)
  const note = [p.label, p.description].filter(Boolean).join('. ')
  return `  - ${bits.join(', ')}${note ? ` — ${note}` : ''}`
}

w('## Steps', '')
for (const [group, nodes] of [...byService].sort()) {
  const spec = catalog.integrations.find((i) => i.id === group)
  w(`### ${spec ? spec.label : group}`, '')
  if (spec) w(`${spec.description} Contacts: ${spec.hosts.join(', ') || 'nothing'}.`, '')
  for (const node of nodes.sort((a, b) => a.type.localeCompare(b.type))) {
    const kind = node.poll ? 'trigger, polls' : node.category
    w(`- **\`${node.type}\`** (${kind}) — ${node.description || node.label}`)
    if (node.outputs?.length > 1) w(`  - ports: ${node.outputs.join(', ')}`)
    for (const p of node.params ?? []) w(paramLine(p))
  }
  w('')
}

w('## Keys you can save', '')
for (const type of catalog.credentialTypes.sort((a, b) => a.type.localeCompare(b.type))) {
  const fields = (type.fields ?? []).map((f) => `${f.key}${f.required === false ? ' (optional)' : ''}`).join(', ')
  w(`- \`${type.type}\` — ${type.label}${fields ? `: ${fields}` : ''}`)
}
w('')

const exampleDir = path.join(app, 'automations')
w('## Working examples', '')
for (const file of (await readdir(exampleDir)).filter((f) => f.endsWith('.json')).sort()) {
  const wf = JSON.parse(await readFile(path.join(exampleDir, file), 'utf8'))
  w(`### ${wf.name}`, '', wf.notes || '', '', '```json', JSON.stringify({ nodes: wf.nodes, edges: wf.edges }, null, 2), '```', '')
}

w('## What it cannot do',
  '',
  '- Sign or send a transaction. `web3.prepare` simulates and reports the fee; a person signs.',
  '- Loop or repeat a step. Lists page themselves; nothing else repeats.',
  '- Receive a webhook from the internet without a tunnel, which the app opens on request.',
  '- Cron expressions. Schedules are every N minutes, hours or days, or once at a set time.',
  '')

await writeFile(path.join(here, '../public/zorilla.md'), out.join('\n'))

// the prompt somebody hands to an assistant to get an integration written
const { copyFile } = await import('node:fs/promises')
await copyFile(path.join(app, 'docs/integration-prompt.md'), path.join(here, '../public/integration-prompt.md'))
console.log(`agent doc: ${out.join('\n').length} characters`)
