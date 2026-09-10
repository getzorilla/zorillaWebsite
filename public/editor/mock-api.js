// The demo editor is the real editor with no engine behind it.
//
// Everything the editor asks the server for is answered here instead: the step
// catalogue comes from a static file, and whatever you build is kept in this
// browser. Nothing runs, no key is ever asked for, and nothing leaves the page.
// Export what you build and import it into the app to actually run it.
(() => {
  const KEY = 'zorilla-demo-workflows'
  const THEME_KEY = 'zorilla-demo-theme'
  let STARTERS = null

  const loadStarters = async () => {
    if (STARTERS) return STARTERS
    try {
      const shipped = await realFetch('/starters.json').then((r) => r.json())
      STARTERS = shipped.map((s, i) => ({
        id: `demo${i}`,
        name: s.package.name ?? s.title,
        folder: 'examples',
        notes: s.summary ?? '',
        active: false,
        nodes: s.package.nodes,
        edges: s.package.edges,
      }))
    } catch {
      STARTERS = []
    }
    return STARTERS
  }

  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY))
      if (Array.isArray(saved) && saved.length) return saved
    } catch { /* first visit */ }
    return (STARTERS ?? []).map((w) => structuredClone(w))
  }
  const write = (list) => {
    try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* private window */ }
  }

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

  let catalog = null
  const realFetch = window.fetch.bind(window)

  window.EventSource = class {
    constructor() { this.onmessage = null }
    close() {}
  }

  window.fetch = async (input, options = {}) => {
    const url = typeof input === 'string' ? input : input.url
    if (!url.startsWith('/api/')) return realFetch(input, options)

    const method = (options.method ?? 'GET').toUpperCase()
    const body = options.body ? JSON.parse(options.body) : {}
    const path = url.split('?')[0]
    catalog ??= await realFetch('/catalog.json').then((r) => r.json())
    await loadStarters()
    const workflows = read()

    if (path === '/api/state') {
      return json({
        port: 5177,
        home: 'this browser',
        workspace: { name: 'demo workspace', folders: [], theme: localStorage.getItem(THEME_KEY) ?? 'zorilla-dark' },
        nodes: catalog.nodes,
        credentialTypes: catalog.credentialTypes,
        integrations: catalog.integrations,
        themes: catalog.themes ?? [],
        credentials: [],
        workflows,
        runs: [],
        problems: [],
      })
    }
    if (path === '/api/themes' && method === 'GET') return json(catalog.themes ?? [])
    if (path === '/api/themes') {
      return json({ error: 'The demo cannot save a theme. Add it in the app, where themes live as files.' }, 400)
    }
    if (path === '/api/workspace') {
      if (method === 'PUT' && body.theme) localStorage.setItem(THEME_KEY, body.theme)
      return json({ name: 'demo workspace', folders: [], theme: localStorage.getItem(THEME_KEY) ?? 'zorilla-dark' })
    }
    if (path === '/api/runs') return json([])
    if (path === '/api/tunnel') {
      return json({ running: false, url: null, installed: false, from: null })
    }
    if (path === '/api/workflows/inspect') {
      const pkg = body.package ?? body
      const known = new Map(catalog.nodes.map((n) => [n.type, n]))
      const specs = new Map(catalog.integrations.map((i) => [i.id, i]))
      const hosts = new Set()
      const credentials = new Set()
      const unknown = new Set()
      const triggers = new Set()
      let runsCode = false
      let readsChain = false
      for (const node of pkg.nodes ?? []) {
        const def = known.get(node.type)
        if (!def) { unknown.add(node.type); continue }
        if (def.category === 'trigger') triggers.add(def.label)
        if (node.type === 'code.js') runsCode = true
        if (def.category === 'web3') { readsChain = true; hosts.add('an Ethereum endpoint') }
        for (const host of specs.get(def.integration)?.hosts ?? []) hosts.add(host)
        for (const param of def.params ?? []) {
          if (param.type === 'credential' && node.params?.[param.key]) credentials.add(node.params[param.key])
        }
      }
      return json({
        workflow: pkg,
        derived: {
          steps: (pkg.nodes ?? []).length, triggers: [...triggers], hosts: [...hosts].sort(),
          credentials: [...credentials].sort(), unknown: [...unknown], runsCode, readsChain,
          buildsTransaction: (pkg.nodes ?? []).some((n) => n.type === 'web3.prepare'),
          writesFiles: (pkg.nodes ?? []).some((n) => n.type === 'file.save'),
        },
      })
    }
    if (path === '/api/workflows/import') {
      const pkg = body.package ?? body
      const saved = { ...pkg, id: `w${Math.random().toString(36).slice(2, 8)}`, folder: 'installed', active: false }
      write([...workflows, saved])
      return json(saved)
    }
    if (path === '/api/credentials') return json([])
    if (path.startsWith('/api/credentials')) {
      return json({ error: 'The demo never asks for a key. Save keys in the app you run yourself.' }, 400)
    }
    if (path.endsWith('/run')) {
      return json({ error: 'Nothing runs here — this page has no engine and no keys. Export it and open it in the app.' }, 400)
    }

    if (path === '/api/workflows') {
      if (method === 'GET') return json(workflows)
      const saved = { ...body, id: body.id || `w${Math.random().toString(36).slice(2, 8)}` }
      write([...workflows.filter((w) => w.id !== saved.id), saved])
      return json(saved)
    }

    const match = path.match(/^\/api\/workflows\/([^/]+)$/)
    if (match) {
      const id = match[1]
      if (method === 'GET') {
        const found = workflows.find((w) => w.id === id)
        return found ? json(found) : json({ error: 'gone' }, 404)
      }
      if (method === 'PUT') {
        const saved = { ...body, id }
        write([...workflows.filter((w) => w.id !== id), saved])
        return json(saved)
      }
      if (method === 'DELETE') {
        write(workflows.filter((w) => w.id !== id))
        return json({ ok: true })
      }
    }
    return json({ error: 'Not part of the demo.' }, 404)
  }
})()
