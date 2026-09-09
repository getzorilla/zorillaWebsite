// The demo editor is the real editor with no engine behind it.
//
// Everything the editor asks the server for is answered here instead: the step
// catalogue comes from a static file, and whatever you build is kept in this
// browser. Nothing runs, no key is ever asked for, and nothing leaves the page.
// Export what you build and import it into the app to actually run it.
(() => {
  const KEY = 'zorilla-demo-workflows'
  const THEME_KEY = 'zorilla-demo-theme'
  const STARTER = {
    id: 'demo',
    name: 'eth price watch',
    folder: '',
    active: false,
    nodes: [
      { id: 'clock', type: 'core.schedule', name: '', params: { mode: 'every', every: 15, unit: 'minutes' }, position: { x: 60, y: 180 } },
      { id: 'price', type: 'coingecko.price', name: '', params: { ids: 'ethereum', currency: 'usd' }, position: { x: 330, y: 180 } },
      { id: 'cross', type: 'logic.changed', name: '', params: { value: '{{ $json.ethereum.usd > 4000 }}', direction: 'becomesTrue', key: '' }, position: { x: 600, y: 180 } },
      { id: 'say', type: 'output.log', name: '', params: { message: 'ETH is {{ $json.ethereum.usd }}' }, position: { x: 870, y: 180 } },
    ],
    edges: [
      { from: 'clock', fromPort: 'main', to: 'price', toPort: 'main' },
      { from: 'price', fromPort: 'main', to: 'cross', toPort: 'main' },
      { from: 'cross', fromPort: 'main', to: 'say', toPort: 'main' },
    ],
  }

  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY))
      if (Array.isArray(saved) && saved.length) return saved
    } catch { /* first visit */ }
    return [structuredClone(STARTER)]
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
