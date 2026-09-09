import catalog from '@/public/catalog.json'

const NODES = new Map(catalog.nodes.map((n) => [n.type, n]))
const INTEGRATIONS = new Map(catalog.integrations.map((i) => [i.id, i]))

// Non-negotiable: what a package can do is worked out by walking the graph, not
// read from anything the author wrote. An author who could write their own
// permission list would simply write a false one.
export function derivePermissions(workflow) {
  const hosts = new Set()
  const credentials = new Set()
  const unknown = new Set()
  const triggers = new Set()
  let runsCode = false
  let readsChain = false
  let buildsTransaction = false

  for (const node of workflow.nodes ?? []) {
    const def = NODES.get(node.type)
    if (!def) {
      unknown.add(node.type)
      continue
    }
    if (def.category === 'trigger') triggers.add(def.label)
    if (node.type === 'code.js') runsCode = true
    if (def.category === 'web3') readsChain = true
    if (node.type === 'web3.prepare') buildsTransaction = true

    if (def.integration) {
      for (const host of INTEGRATIONS.get(def.integration)?.hosts ?? []) hosts.add(host)
    }
    if (node.type === 'net.http') {
      try { hosts.add(new URL(String(node.params?.url ?? '')).host) } catch { hosts.add('a web address set in the automation') }
    }
    for (const param of def.params ?? []) {
      if (param.type === 'credential' && node.params?.[param.key]) credentials.add(node.params[param.key])
    }
  }

  return {
    steps: (workflow.nodes ?? []).length,
    triggers: [...triggers],
    hosts: [...hosts].sort(),
    credentials: [...credentials].sort(),
    unknown: [...unknown].sort(),
    runsCode,
    readsChain,
    buildsTransaction,
  }
}

export function describeIntegrationSubmission(spec) {
  const hosts = new Set()
  for (const action of spec.actions ?? []) {
    const url = String(action.request?.url ?? '')
    const fromField = url.match(/^\{\{\s*key\.([a-zA-Z0-9_]+)\s*\}\}/)
    if (fromField) {
      hosts.add(`a web address you provide (${fromField[1]})`)
      continue
    }
    const parsed = url.match(/^https?:\/\/([^/?#]+)/i)
    if (!parsed || parsed[1].includes('{{')) {
      throw new Error('Every step has to contact a site that is written out, so people can see what it reaches before installing it.')
    }
    hosts.add(parsed[1])
  }
  if (!hosts.size) throw new Error('This integration has no steps.')
  return {
    hosts: [...hosts].sort(),
    actions: (spec.actions ?? []).map((a) => ({ key: a.key, label: a.label })),
    fields: (spec.credential?.fields ?? []).map((f) => ({ key: f.key, label: f.label, secret: Boolean(f.secret) })),
  }
}

// Same rule as the app: a theme is colours and nothing else. Checked here so a
// listing cannot carry a field the app would refuse, or one it would ignore.
const THEME_TOKENS = [
  'bg', 'raise', 'sunk', 'line', 'text', 'dim', 'dimmer',
  'accent', 'onAccent', 'ok', 'warn', 'bad', 'skip', 'grid', 'wire', 'wireHot',
]
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function describeThemeSubmission(theme) {
  if (!theme || typeof theme !== 'object' || Array.isArray(theme)) throw new Error('That file is not a theme.')
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(String(theme.id ?? ''))) {
    throw new Error('A theme needs an id like "nord": lower case, letters, numbers and dashes.')
  }
  const colors = theme.colors
  if (!colors || typeof colors !== 'object') throw new Error('That theme has no colours in it.')
  for (const [key, value] of Object.entries(colors)) {
    if (!THEME_TOKENS.includes(key)) throw new Error(`"${key}" is not a colour zorilla uses.`)
    if (!HEX.test(String(value))) throw new Error(`${key} is "${value}". Colours are hex, like #1e1e2e.`)
  }
  const missing = THEME_TOKENS.filter((t) => !colors[t])
  return {
    hosts: [],
    themeId: theme.id,
    appearance: theme.appearance === 'light' ? 'light' : 'dark',
    colors,
    // a partial theme still works — the app fills the rest from its default
    partial: missing,
  }
}

// A package carries the *name* of a key, never its value. Stripping the fields
// that only make sense on one machine is what makes that true in practice
// rather than by convention.
export function sanitizeWorkflow(input) {
  return {
    name: String(input.name ?? 'untitled automation'),
    nodes: (input.nodes ?? []).map((n) => ({
      id: n.id, type: n.type, name: n.name ?? '', params: n.params ?? {}, position: n.position ?? { x: 0, y: 0 },
      // how a step behaves when it fails travels with it; none of it is secret
      onError: ['continue', 'errorOutput'].includes(n.onError) ? n.onError : 'stop',
      retries: Math.min(5, Math.max(0, Number(n.retries) || 0)),
      retryWait: Math.min(60000, Math.max(0, Number(n.retryWait) || 0)),
    })),
    edges: (input.edges ?? []).map((e) => ({
      from: e.from, to: e.to, fromPort: e.fromPort ?? 'main', toPort: e.toPort ?? 'main',
    })),
  }
}

export const slugify = (text) =>
  String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
