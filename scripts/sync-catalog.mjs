// Pulls the step and integration catalogue out of the app repo so the website
// can show what zorilla can do, and so the demo editor has a real palette.
// The result is committed, so the site builds without the app checked out.
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = process.env.ZORILLA_APP ?? path.join(here, '../../zorillaApp')
const load = (rel) => import(pathToFileURL(path.join(app, rel)).href)

const { loadNodes, describe } = await load('src/engine/registry.js')
const { loadCredentialTypes, describeType } = await load('src/credentials/registry.js')
const { loadIntegrations, nodesFor, credentialTypeFor, describeIntegration } = await load('src/integrations/registry.js')
const { loadThemes } = await load('src/themes/registry.js')

const code = await loadNodes({ builtinDir: path.join(app, 'src/nodes') })
const rawTypes = await loadCredentialTypes({})
const { integrations } = await loadIntegrations({ builtinDir: path.join(app, 'src/integrations/builtin') })
const { themes } = await loadThemes({ builtinDir: path.join(app, 'src/themes/builtin') })

const nodes = new Map(code.nodes)
const credentialTypes = new Map(rawTypes)
for (const spec of integrations.values()) {
  const type = credentialTypeFor(spec)
  if (type) credentialTypes.set(type.type, type)
  for (const def of nodesFor(spec)) nodes.set(def.type, def)
}

// The site drew service marks from its own copy of the logo folder, which went
// stale the moment the app gained one. Copy them across every sync, and record
// which ones exist so no component has to keep its own list.
const { readdir: readLogoDir, copyFile, mkdir } = await import('node:fs/promises')
const logoFrom = path.join(app, 'public/logos')
const logoInto = path.join(here, '../public/editor/logos')
await mkdir(logoInto, { recursive: true })
const logos = (await readLogoDir(logoFrom)).filter((f) => f.endsWith('.svg'))
for (const file of logos) await copyFile(path.join(logoFrom, file), path.join(logoInto, file))

const catalog = {
  generatedAt: new Date().toISOString(),
  logos: logos.map((f) => f.replace(/\.svg$/, '')).sort(),
  nodes: [...nodes.values()].map(describe),
  credentialTypes: [...credentialTypes.values()].map(describeType),
  integrations: [...integrations.values()].map(describeIntegration),
  themes: [...themes.values()].map(({ source, declared, ...theme }) => theme),
}

await writeFile(path.join(here, '../public/catalog.json'), JSON.stringify(catalog, null, 2))

// Demo names are written lowercase for the app's own list. On the marketplace
// they are headings, so: capitals, except the small words that never take one,
// and the names that are spelled a particular way.
const SMALL = new Set(['a', 'an', 'and', 'by', 'for', 'in', 'of', 'on', 'per', 'the', 'to'])
const SPELLED = {
  eth: 'ETH', usdc: 'USDC', x: 'X', kol: 'KOL', sms: 'SMS', api: 'API',
  slack: 'Slack', discord: 'Discord', telegram: 'Telegram', notion: 'Notion',
  stripe: 'Stripe', gmail: 'Gmail', resend: 'Resend', claude: 'Claude',
}
const prettyTitle = (name) => name
  .replace(/^demo\d+:\s*/, '')
  .split(' ')
  .map((word, i) => {
    const low = word.toLowerCase()
    if (SPELLED[low]) return SPELLED[low]
    if (i > 0 && SMALL.has(low)) return low
    return low.charAt(0).toUpperCase() + low.slice(1)
  })
  .join(' ')

// The automations that ship with the app are also the marketplace's first
// listings. An empty marketplace reads as abandoned, and these are the same
// files a new install already has, so nothing here is a mock-up.
const { readdir, readFile } = await import('node:fs/promises')
const exampleDir = path.join(app, 'automations')
const starters = []
for (const file of (await readdir(exampleDir)).filter((f) => f.endsWith('.json'))) {
  const wf = JSON.parse(await readFile(path.join(exampleDir, file), 'utf8'))
  starters.push({
    slug: file.replace(/\.json$/, ''),
    // the demoNN prefix orders them in the app's own list; nobody browsing the
    // marketplace needs to see it
    title: prettyTitle(wf.name),
    summary: wf.notes ?? '',
    package: { name: wf.name.replace(/^demo\d+:\s*/, ''), nodes: wf.nodes, edges: wf.edges },
  })
}
await writeFile(path.join(here, '../public/starters.json'), JSON.stringify(starters, null, 2))
console.log(`starters: ${starters.length} automations`)
console.log(`catalog: ${catalog.nodes.length} steps, ${catalog.integrations.length} integrations, ${catalog.themes.length} themes, ${logos.length} logos`)
