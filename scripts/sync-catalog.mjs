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

const catalog = {
  generatedAt: new Date().toISOString(),
  nodes: [...nodes.values()].map(describe),
  credentialTypes: [...credentialTypes.values()].map(describeType),
  integrations: [...integrations.values()].map(describeIntegration),
  themes: [...themes.values()].map(({ source, declared, ...theme }) => theme),
}

await writeFile(path.join(here, '../public/catalog.json'), JSON.stringify(catalog, null, 2))

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
    title: wf.name,
    summary: wf.notes ?? '',
    package: { name: wf.name, nodes: wf.nodes, edges: wf.edges },
  })
}
await writeFile(path.join(here, '../public/starters.json'), JSON.stringify(starters, null, 2))
console.log(`starters: ${starters.length} automations`)
console.log(`catalog: ${catalog.nodes.length} steps, ${catalog.integrations.length} integrations, ${catalog.themes.length} themes`)
