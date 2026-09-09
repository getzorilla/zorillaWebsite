// Geometry here has to agree with .node and .port in style.css.
const NODE_W = 210
const IN_Y = 26
const OUT_Y = 26
const OUT_STEP = 18

const $ = (id) => document.getElementById(id)

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue
    if (key === 'class') node.className = value
    else if (key === 'text') node.textContent = value
    else node[key] = value
  }
  node.append(...kids.flat().filter((k) => k || k === 0))
  return node
}

const state = {
  view: 'home',
  panel: 'automations',
  folder: null,
  workspace: { name: 'my workspace', folders: [] },
  defs: new Map(),
  credentialTypes: new Map(),
  integrations: [],
  credentials: [],
  themes: [],
  paletteService: null,
  keyDraftType: null,
  workflows: [],
  wf: null,
  selected: null,
  runs: [],
  run: null,
  home: { port: 5177, path: '' },
  viewBox: { x: 60, y: 40, k: 1 },
}

const api = async (path, options = {}) => {
  const res = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

let toastTimer
function toast(message, bad = false) {
  const node = $('toast')
  node.textContent = message
  node.className = `toast show${bad ? ' bad' : ''}`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { node.className = 'toast' }, 2600)
}

const typeLabel = (type) => state.credentialTypes.get(type)?.label ?? type

// Services that ship with a logo file. Anything else falls back to a letter in
// the same box, so a row of them still lines up.
const LOGOS = new Set([
  'airtable', 'anthropic', 'coingecko', 'deepseek', 'discord', 'etherscan', 'gemini',
  'gmail', 'notion', 'openai', 'resend', 'slack', 'stripe', 'supabase', 'telegram',
  'twilio', 'web3',
])

// Which service a step belongs to. Integration steps say so; the rest are named
// after their service already (gmail.send), and the built-ins are not services.
const SERVICE_LABEL = { web3: 'Web3', gmail: 'Gmail' }
const CORE = new Set(['core', 'logic', 'flow', 'transform', 'output', 'net', 'code'])
function serviceOf(def) {
  if (def.integration) return def.integration
  const prefix = String(def.type).split('.')[0]
  return CORE.has(prefix) ? null : prefix
}

function logoEl(id, size = 22) {
  const box = el('span', { class: 'logo', style: `width:${size}px;height:${size}px` })
  const own = state.integrations.find((i) => i.id === id)?.icon
  if (own) {
    box.append(el('img', { src: own, alt: '', width: size, height: size }))
  } else if (LOGOS.has(id)) {
    box.append(el('img', { src: `/editor/logos/${id}.svg`, alt: '', width: size, height: size }))
  } else {
    box.classList.add('letter')
    box.append(el('span', { text: String(id ?? '?').charAt(0).toUpperCase() }))
  }
  return box
}
const relative = (iso) => {
  if (!iso) return 'never run'
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`
  return `${Math.round(seconds / 86400)}d ago`
}

// ---------------------------------------------------------------- views

function showView(view) {
  state.view = view
  $('home-view').hidden = view !== 'home'
  $('editor-view').hidden = view !== 'editor'
  $('editor-controls').hidden = view !== 'editor'
  $('crumb-sep').hidden = view !== 'editor'
  $('automation-name').hidden = view !== 'editor'
  if (view === 'home') renderHome()
}

function renderCrumbs() {
  $('workspace-name').textContent = state.workspace.name
  document.title = state.wf && state.view === 'editor'
    ? `${state.wf.name} · ${state.workspace.name}`
    : state.workspace.name
  if (state.wf) $('automation-name').textContent = state.wf.name
  $('home-meta').textContent = `127.0.0.1:${state.home.port}`
}

$('go-home').onclick = () => showView('home')

$('workspace-name').onclick = async () => {
  const name = prompt('name this workspace', state.workspace.name)
  if (name === null) return
  state.workspace = await api('/api/workspace', { method: 'PUT', body: { name } })
  renderCrumbs()
  if (state.view === 'home') renderHome()
}

$('automation-name').onclick = () => {
  const name = prompt('name this automation', state.wf.name)
  if (name === null) return
  state.wf.name = name.trim() || state.wf.name
  renderCrumbs()
  touch()
}

for (const item of document.querySelectorAll('.rail-item')) {
  item.onclick = () => {
    state.panel = item.dataset.panel
    for (const other of document.querySelectorAll('.rail-item')) {
      other.classList.toggle('active', other === item)
    }
    renderHome()
  }
}

function renderHome() {
  renderCrumbs()
  if (state.panel === 'automations') return renderAutomations()
  if (state.panel === 'keys') return renderKeysHome()
  if (state.panel === 'themes') return renderThemes()
  return renderIntegrationsHome()
}

// ---------------------------------------------------------------- automations

function lastRunFor(workflowId) {
  return state.runs.find((r) => r.workflowId === workflowId) ?? null
}

function renderAutomations() {
  const side = $('home-side')
  const sheet = $('home-sheet')
  side.textContent = ''
  sheet.textContent = ''

  const folders = [...new Set(state.workflows.map((w) => w.folder).filter(Boolean))].sort()
  const counts = (folder) =>
    state.workflows.filter((w) => (folder === null ? true : (w.folder || '') === folder)).length

  side.append(el('div', { class: 'side-title', text: 'folders' }))
  const entry = (label, folder) =>
    el('div', {
      class: `side-item${state.folder === folder ? ' active' : ''}`,
      onclick: () => { state.folder = folder; renderAutomations() },
    }, el('span', { text: label }), el('span', { class: 'count', text: String(counts(folder)) }))

  side.append(entry('all', null), entry('loose', ''))
  for (const folder of folders) side.append(entry(folder, folder))
  side.append(el('div', {
    class: 'side-item',
    onclick: async () => {
      const name = prompt('new folder')
      if (!name?.trim()) return
      state.workspace = await api('/api/workspace', {
        method: 'PUT',
        body: { folders: [...state.workspace.folders, name.trim()] },
      })
      state.folder = name.trim()
      renderAutomations()
    },
  }, el('span', { text: '+ folder' })))

  const shown = state.workflows.filter((w) => state.folder === null || (w.folder || '') === state.folder)

  sheet.append(el('div', { class: 'sheet-head' },
    el('h1', { text: state.workspace.name }),
    el('p', { text: `${state.workflows.length} automation${state.workflows.length === 1 ? '' : 's'}` })))

  sheet.append(el('div', { class: 'sheet-actions' },
    el('button', { class: 'primary', text: 'new automation', onclick: () => newAutomation() }),
    el('button', { class: 'ghost', text: 'open editor', onclick: () => {
      const first = shown[0] ?? state.workflows[0]
      first ? openWorkflow(first.id) : newAutomation()
    } })))

  if (!shown.length) {
    sheet.append(el('div', { class: 'empty', text: 'nothing here yet' }))
    return
  }

  const list = el('div', { class: 'row-list' })
  for (const workflow of shown) {
    const run = lastRunFor(workflow.id)
    const row = el('div', { class: 'row', onclick: () => openWorkflow(workflow.id) },
      el('span', { class: `dot${workflow.active ? ' on' : ''}`, title: workflow.active ? 'on' : 'off' }),
      el('div', { class: 'grow' },
        el('div', { class: 'name', text: workflow.name }),
        el('div', { class: 'meta', text: [workflow.folder || 'loose', run ? `${run.status} ${relative(run.startedAt)}` : 'never run'].join('  ·  ') })),
      el('div', { class: 'row-actions' },
        el('button', { class: 'ghost', text: 'run', onclick: async (event) => {
          event.stopPropagation()
          try {
            const result = await api(`/api/workflows/${workflow.id}/run`, { method: 'POST', body: {} })
            state.runs = await api('/api/runs')
            toast(`${workflow.name}: ${result.status}`, result.status !== 'ok')
            renderAutomations()
          } catch (err) { toast(err.message, true) }
        } }),
        el('button', { class: 'ghost', text: 'delete', onclick: async (event) => {
          event.stopPropagation()
          if (!confirm(`delete "${workflow.name}"? this cannot be undone.`)) return
          await api(`/api/workflows/${workflow.id}`, { method: 'DELETE' })
          state.workflows = await api('/api/workflows')
          renderAutomations()
        } })))
    list.append(row)
  }
  sheet.append(list)
}

async function newAutomation() {
  const saved = await api('/api/workflows', {
    method: 'POST',
    body: { name: 'untitled automation', folder: state.folder ?? '', nodes: [], edges: [] },
  })
  state.workflows = await api('/api/workflows')
  openWorkflow(saved.id)
}

// ---------------------------------------------------------------- keys

function renderKeysHome() {
  const side = $('home-side')
  const sheet = $('home-sheet')
  side.textContent = ''
  sheet.textContent = ''

  side.append(el('div', { class: 'side-title', text: 'saved keys' }))
  if (!state.credentials.length) side.append(el('div', { class: 'hint', text: 'none yet' }))
  for (const cred of state.credentials) {
    side.append(el('div', { class: 'side-item' },
      el('span', { text: cred.name }),
      el('span', { class: 'count', text: typeLabel(cred.type) })))
  }

  sheet.append(el('div', { class: 'sheet-head' },
    el('h1', { text: 'keys' }),
    el('p', { text: 'encrypted here. an automation stores a key\u2019s name, never its value.' })))

  const host = el('div', { class: 'max' })
  sheet.append(host)
  renderKeysInto(host)
}

// Used on the workspace page and inside the editor, so adding a key never means
// leaving what you were building.
function renderKeysInto(host) {
  host.textContent = ''
  const draft = {
    type: state.keyDraftType ?? state.credentialTypes.keys().next().value ?? 'generic',
    values: {}, pairs: [],
  }
  state.keyDraftType = null

  const list = el('div')
  const form = el('div')
  host.append(list, el('div', { class: 'panel-title', style: 'margin-top:18px', text: 'add a key' }), form)

  const drawList = () => {
    list.textContent = ''
    if (!state.credentials.length) {
      list.append(el('p', { class: 'hint', text: 'nothing saved yet.' }))
      return
    }
    for (const cred of state.credentials) {
      const meta = el('div', { class: 'meta' },
        el('div', { class: 'row-inline' }, logoEl(cred.type, 20), el('code', { text: cred.name })),
        el('div', { class: 'hint', text: typeLabel(cred.type) }))
      const actions = el('div', { class: 'actions' })

      if (state.credentialTypes.get(cred.type)?.checkable) {
        const check = el('button', { class: 'ghost', text: 'test', onclick: async () => {
          check.textContent = '…'
          try {
            const result = await api(`/api/credentials/${encodeURIComponent(cred.name)}/test`, { method: 'POST', body: {} })
            meta.querySelector('.check')?.remove()
            meta.append(el('div', { class: `check ${result.ok ? 'good' : 'bad'}`, text: result.message }))
          } catch (err) { toast(err.message, true) }
          check.textContent = 'test'
        } })
        actions.append(check)
      }
      actions.append(el('button', { class: 'ghost', text: 'delete', onclick: async () => {
        const { credentials } = await api(`/api/credentials/${encodeURIComponent(cred.name)}`, { method: 'DELETE' })
        state.credentials = credentials
        drawList()
        renderInspector()
      } }))
      list.append(el('div', { class: 'cred-row' }, meta, actions))
    }
  }

  const drawForm = () => {
    form.textContent = ''
    const type = state.credentialTypes.get(draft.type)

    const grid = el('div', { class: 'service-grid picker' })
    for (const candidate of [...state.credentialTypes.values()].sort((a, b) => a.label.localeCompare(b.label))) {
      grid.append(el('button', {
        class: `service-tile${candidate.type === draft.type ? ' active' : ''}`,
        title: candidate.label,
        onclick: () => { draft.type = candidate.type; draft.values = {}; drawForm() },
      }, logoEl(candidate.type, 26), el('small', { text: candidate.label })))
    }
    form.append(field('service', grid, type?.description))

    const name = el('input', { type: 'text', spellcheck: false, placeholder: `my_${draft.type}` })
    form.append(field('name', name, 'what steps will call this key.'))

    if (!type?.fields) {
      form.append(field('fields', keyValueControl(draft.pairs, (rows) => { draft.pairs = rows }),
        'read them in a step with {{ $creds.name.field }}.'))
    } else {
      for (const spec of type.fields) {
        const input = el('input', {
          type: spec.secret ? 'password' : 'text',
          placeholder: spec.placeholder ?? '',
          value: draft.values[spec.key] ?? spec.default ?? '',
        })
        draft.values[spec.key] = input.value
        input.oninput = () => { draft.values[spec.key] = input.value }
        form.append(field(spec.required === false ? `${spec.label} (optional)` : spec.label, input, spec.description))
      }
      if (type.docs) {
        form.append(el('a', { href: type.docs, target: '_blank', rel: 'noreferrer', class: 'hint', text: 'where to find this key' }))
      }
    }

    if (type?.hosts?.length) {
      const tags = el('div', { style: 'margin:10px 0' })
      tags.append(el('span', { class: 'hint', text: 'this key is sent to  ' }))
      for (const host of type.hosts) tags.append(el('span', { class: 'tag', text: host }))
      for (const warning of type.warnings ?? []) tags.append(el('span', { class: 'tag warn', text: warning }))
      form.append(tags)
    }

    const problem = el('p', { class: 'error' })
    const values = () => (type?.fields
      ? { ...draft.values }
      : Object.fromEntries(draft.pairs.filter((r) => r.name).map((r) => [r.name, r.value])))

    form.append(el('div', { class: 'row-inline' },
      el('button', { class: 'primary', text: 'save', onclick: async () => {
        problem.className = 'error'
        problem.textContent = ''
        try {
          const result = await api(`/api/credentials/${encodeURIComponent(name.value.trim())}`,
            { method: 'PUT', body: { type: draft.type, values: values() } })
          state.credentials = result.credentials
          draft.values = {}
          draft.pairs = []
          drawList()
          drawForm()
          renderInspector()
          toast(`saved ${name.value.trim()}`)
        } catch (err) { problem.textContent = err.message }
      } }),
      type?.test ? el('button', { class: 'ghost', text: 'test', onclick: async () => {
        problem.className = 'error'
        problem.textContent = 'checking…'
        try {
          const result = await api(`/api/credentials/${encodeURIComponent(name.value.trim() || 'draft')}/test`,
            { method: 'POST', body: { type: draft.type, values: values() } })
          problem.className = `error check ${result.ok ? 'good' : 'bad'}`
          problem.textContent = result.message
        } catch (err) { problem.textContent = err.message }
      } }) : null))
    form.append(problem)
  }

  drawList()
  drawForm()
}

// ---------------------------------------------------------------- integrations

function renderIntegrationsHome() {
  const side = $('home-side')
  const sheet = $('home-sheet')
  side.textContent = ''
  sheet.textContent = ''

  const mine = state.integrations.filter((i) => i.editable)
  const shipped = state.integrations.filter((i) => !i.editable)

  side.append(el('div', { class: 'side-item', onclick: () => showIntegrationEditor(null) },
    el('span', { text: '+ create integration' })))

  if (mine.length) {
    side.append(el('div', { class: 'side-title spaced', text: 'yours' }))
    for (const spec of mine) {
      side.append(el('div', { class: 'side-item', onclick: () => showIntegration(spec.id) },
        el('span', { text: spec.label }), el('span', { class: 'count', text: `${spec.actions.length}` })))
    }
  }

  side.append(el('div', { class: 'side-title spaced', text: 'built in' }))
  for (const spec of shipped) {
    side.append(el('div', { class: 'side-item', onclick: () => showIntegration(spec.id) },
      el('span', { text: spec.label }), el('span', { class: 'count', text: `${spec.actions.length}` })))
  }

  sheet.append(el('div', { class: 'sheet-head' },
    el('h1', { text: 'integrations' }),
    el('p', { text: 'a file, not code: the fields a service needs and the requests it makes. installing one runs nothing.' })))

  const list = el('div', { class: 'integration-list' })
  for (const spec of state.integrations) {
    const row = el('button', { class: 'integration-row', onclick: () => showIntegration(spec.id) },
      logoEl(spec.id, 28),
      el('span', { class: 'grow' },
        el('span', { class: 'integration-name', text: spec.label }),
        el('small', { text: spec.description || '' })),
      el('span', { class: 'count', text: `${spec.actions.length} step${spec.actions.length === 1 ? '' : 's'}` }))
    if (spec.editable) row.append(el('span', { class: 'tag', text: 'yours' }))
    list.append(row)
  }
  sheet.append(list)
}

function showIntegration(id) {
  const spec = state.integrations.find((i) => i.id === id)
  const sheet = $('home-sheet')
  sheet.textContent = ''
  sheet.append(el('div', { class: 'sheet-head' },
    el('h1', { text: spec.label }),
    el('p', { text: spec.description || '' })))

  const tags = el('div', { style: 'margin-bottom:16px' })
  tags.append(el('span', { class: 'hint', text: 'contacts  ' }))
  for (const host of spec.hosts) tags.append(el('span', { class: 'tag', text: host }))
  for (const warning of spec.warnings) tags.append(el('span', { class: 'tag warn', text: warning }))
  sheet.append(tags)

  const steps = el('div', { class: 'card max' }, el('h3', { text: 'steps' }))
  for (const action of spec.actions) {
    steps.append(el('p', {}, el('code', { text: `${spec.id}.${action.key}` }), ` — ${action.label}`))
  }
  sheet.append(steps)

  if (spec.fields.length) {
    const fields = el('div', { class: 'card max' }, el('h3', { text: 'what you fill in' }))
    for (const f of spec.fields) {
      fields.append(el('p', {}, el('code', { text: f.label }), f.secret ? ' — kept secret' : ''))
    }
    sheet.append(fields)
  }

  sheet.append(el('div', { class: 'row-inline' },
    el('button', { class: 'ghost', text: spec.editable ? 'edit' : 'copy and edit', onclick: () => showIntegrationEditor(spec.id) }),
    spec.editable ? el('button', { class: 'ghost', text: 'delete', onclick: async () => {
      if (!confirm(`delete the "${spec.label}" integration?`)) return
      await api(`/api/integrations/${spec.id}`, { method: 'DELETE' })
      await reloadIntegrations()
      renderIntegrationsHome()
    } }) : null,
    el('button', { class: 'ghost', text: 'back', onclick: renderIntegrationsHome })))
}

const BLANK_INTEGRATION = {
  id: '', label: '', description: '', docs: '', category: 'action',
  credential: { fields: [{ key: 'apiKey', label: 'API key', secret: true, required: true }], auth: { headers: { Authorization: 'Bearer {{ apiKey }}' } } },
  actions: [{
    key: 'send', label: 'Do the thing',
    params: [{ key: 'text', label: 'Text', type: 'textarea' }],
    request: { method: 'POST', url: 'https://api.example.com/v1/things', json: { text: '{{ text }}' } },
    errorPath: 'error.message',
  }],
}

async function showIntegrationEditor(sourceId) {
  const sheet = $('home-sheet')
  sheet.textContent = ''
  let spec = structuredClone(BLANK_INTEGRATION)
  if (sourceId) {
    const loaded = await api(`/api/integrations/${sourceId}`)
    const editable = state.integrations.find((i) => i.id === sourceId)?.editable
    spec = { ...loaded, id: editable ? loaded.id : `${loaded.id}_copy` }
  }

  sheet.append(el('div', { class: 'sheet-head' },
    el('h1', { text: sourceId ? 'edit integration' : 'create integration' }),
    el('p', { text: 'saved as a file in ~/.zorilla/integrations. no code in it.' })))

  const editor = el('textarea', { rows: 26, spellcheck: false, value: JSON.stringify(spec, null, 2), class: 'max', style: 'width:100%' })
  const readout = el('div', { style: 'margin:10px 0' })
  const problem = el('p', { class: 'error' })

  // The picture goes into the file itself, so an integration you hand somebody
  // arrives with its own icon and needs nothing else alongside it.
  const preview = el('span', { class: 'logo', style: 'width:28px;height:28px' })
  const drawPreview = () => {
    preview.textContent = ''
    let current = null
    try { current = JSON.parse(editor.value).icon } catch { /* mid-edit */ }
    if (current) preview.append(el('img', { src: current, alt: '', width: 28, height: 28 }))
    else preview.append(el('span', { class: 'hint', text: 'none' }))
  }
  const picker = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp' })
  picker.onchange = async () => {
    const file = picker.files?.[0]
    if (!file) return
    if (file.size > 140_000) { problem.textContent = 'that picture is too big. around 128 pixels square is plenty.'; return }
    const dataUri = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    try {
      const parsed = JSON.parse(editor.value)
      parsed.icon = dataUri
      editor.value = JSON.stringify(parsed, null, 2)
      problem.textContent = ''
      drawPreview()
    } catch (err) { problem.textContent = `fix the json first: ${err.message}` }
  }
  sheet.append(field('icon', el('div', { class: 'row-inline' }, preview, picker,
    el('button', { class: 'ghost', text: 'remove', onclick: () => {
      try {
        const parsed = JSON.parse(editor.value)
        delete parsed.icon
        editor.value = JSON.stringify(parsed, null, 2)
        drawPreview()
      } catch { /* leave it */ }
    } })), 'png, jpeg or webp. it is stored inside the integration file.'))
  drawPreview()

  const check = async () => {
    readout.textContent = ''
    problem.textContent = ''
    let parsed
    try {
      parsed = JSON.parse(editor.value)
    } catch (err) {
      problem.textContent = `not valid JSON: ${err.message}`
      return null
    }
    const result = await api('/api/integrations/check', { method: 'POST', body: parsed })
    if (!result.ok) {
      problem.textContent = result.error
      return null
    }
    readout.append(el('span', { class: 'hint', text: `${result.actions} step(s), contacts  ` }))
    for (const host of result.hosts) readout.append(el('span', { class: 'tag', text: host }))
    for (const warning of result.warnings) readout.append(el('span', { class: 'tag warn', text: warning }))
    return parsed
  }

  editor.oninput = () => { problem.textContent = ''; readout.textContent = '' }

  sheet.append(el('div', { class: 'max' }, editor), readout,
    el('div', { class: 'row-inline' },
      el('button', { class: 'ghost', text: 'check', onclick: check }),
      el('button', { class: 'primary', text: 'save', onclick: async () => {
        const parsed = await check()
        if (!parsed) return
        try {
          await api(`/api/integrations/${parsed.id}`, { method: 'PUT', body: parsed })
          await reloadIntegrations()
          toast(`saved ${parsed.label}`)
          renderIntegrationsHome()
        } catch (err) { problem.textContent = err.message }
      } }),
      el('button', { class: 'ghost', text: 'cancel', onclick: renderIntegrationsHome })),
    problem)
  check()
}

async function reloadIntegrations() {
  const boot = await api('/api/state')
  state.defs = new Map(boot.nodes.map((d) => [d.type, d]))
  state.credentialTypes = new Map(boot.credentialTypes.map((t) => [t.type, t]))
  state.integrations = boot.integrations
  state.credentials = boot.credentials
  renderPalette()
}

// ---------------------------------------------------------------- themes

// A theme is a list of colours, so applying one is writing custom properties on
// the root element. Nothing else in the page knows a theme exists.
const CSS_VAR = {
  bg: '--bg', raise: '--raise', sunk: '--sunk', line: '--line',
  text: '--text', dim: '--dim', dimmer: '--dimmer',
  accent: '--accent', onAccent: '--on-accent',
  ok: '--ok', warn: '--warn', bad: '--bad', skip: '--skip',
  grid: '--grid', wire: '--wire', wireHot: '--wire-hot',
}

const themeColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'

function applyTheme(theme) {
  if (!theme) return
  const root = document.documentElement
  for (const [key, variable] of Object.entries(CSS_VAR)) {
    if (theme.colors[key]) root.style.setProperty(variable, theme.colors[key])
  }
  root.style.setProperty('color-scheme', theme.appearance === 'light' ? 'light' : 'dark')
  state.workspace.theme = theme.id
  if (state.view === 'editor' && state.wf) drawWires()
}

function currentTheme() {
  return state.themes.find((t) => t.id === state.workspace.theme) ?? state.themes[0]
}

async function useTheme(id) {
  const theme = state.themes.find((t) => t.id === id)
  if (!theme) return
  applyTheme(theme)
  state.workspace = await api('/api/workspace', { method: 'PUT', body: { theme: id } })
  if (state.view === 'home' && state.panel === 'themes') renderThemes()
}

async function reloadThemes() {
  state.themes = await api('/api/themes')
  applyTheme(currentTheme())
}

function themeSwatch(theme) {
  const c = theme.colors
  return el('div', { class: 'theme-preview', style: `background:${c.bg}` },
    el('div', { class: 'strip' },
      el('div', { class: 'dot', style: `background:${c.accent}` }),
      el('div', { class: 'plank', style: `background:${c.line}` }),
      el('div', { class: 'dot', style: `background:${c.ok}` })),
    el('div', { class: 'swatch-step', style: `background:${c.raise};border:1px solid ${c.line}` },
      el('div', { class: 'dot', style: `background:${c.accent};width:6px;height:6px` }),
      el('span', { style: `background:${c.text};opacity:.7` })),
    el('div', { class: 'swatch-step', style: `background:${c.raise};border:1px solid ${c.line};margin-left:24px` },
      el('div', { class: 'dot', style: `background:${c.warn};width:6px;height:6px` }),
      el('span', { style: `background:${c.dim}` })))
}

function renderThemes() {
  const side = $('home-side')
  const sheet = $('home-sheet')
  side.textContent = ''
  sheet.textContent = ''

  side.append(el('p', { class: 'side-title', text: 'in this workspace' }))
  for (const kind of ['dark', 'light']) {
    const count = state.themes.filter((t) => t.appearance === kind).length
    side.append(el('div', { class: 'side-item' }, el('span', { text: kind }), el('span', { class: 'count', text: `${count}` })))
  }
  side.append(el('p', { class: 'side-title spaced', text: 'your own' }))
  side.append(el('div', { class: 'hint', style: 'padding:0 9px' },
    `drop a .json file into ~/.zorilla/themes, then refresh`))

  sheet.append(el('div', { class: 'sheet-head' },
    el('h1', { text: 'themes' }),
    el('p', { text: 'hex values, nothing else. colours the whole app.' })))

  sheet.append(el('div', { class: 'sheet-actions' },
    el('button', { class: 'ghost', text: 'refresh', onclick: async () => { await reloadThemes(); renderThemes(); toast('themes reloaded') } }),
    el('button', { class: 'ghost', text: 'add from json', onclick: showThemeEditor }),
    el('button', { class: 'ghost', text: 'copy this one', onclick: async () => {
      const theme = currentTheme()
      await navigator.clipboard.writeText(JSON.stringify({
        id: `${theme.id}-copy`, label: `${theme.label} copy`, appearance: theme.appearance, colors: theme.colors,
      }, null, 2))
      toast('copied')
    } })))

  const grid = el('div', { class: 'theme-grid' })
  for (const theme of state.themes) {
    const card = el('div', {
      class: `theme-card${theme.id === state.workspace.theme ? ' active' : ''}`,
      onclick: () => useTheme(theme.id),
    },
      themeSwatch(theme),
      el('div', { class: 'theme-meta' },
        el('strong', { text: theme.label }),
        el('span', { text: theme.source === 'yours' ? 'yours' : theme.appearance })))
    if (theme.source === 'yours') {
      card.append(el('div', { class: 'row-inline', style: 'padding:0 10px 9px' },
        el('button', {
          class: 'ghost', text: 'remove',
          onclick: async (event) => {
            event.stopPropagation()
            if (!confirm(`remove the "${theme.label}" theme?`)) return
            await api(`/api/themes/${theme.id}`, { method: 'DELETE' })
            await reloadThemes()
            if (!state.themes.some((t) => t.id === state.workspace.theme)) await useTheme('zorilla-dark')
            renderThemes()
          },
        })))
    }
    grid.append(card)
  }
  sheet.append(grid)
}

function showThemeEditor() {
  const sheet = $('home-sheet')
  sheet.textContent = ''
  const theme = currentTheme()
  const start = JSON.stringify({
    id: 'my-theme', label: 'My theme', appearance: theme.appearance, author: '', colors: theme.colors,
  }, null, 2)

  const box = el('textarea', { value: start, style: 'width:100%;min-height:360px' })
  const problem = el('p', { class: 'error' })

  sheet.append(el('div', { class: 'sheet-head' },
    el('h1', { text: 'add a theme' }),
    el('p', { text: 'paste one. it is saved as a file in your themes folder.' })))
  sheet.append(box, problem)
  sheet.append(el('div', { class: 'row-inline' },
    el('button', {
      class: 'primary', text: 'save',
      onclick: async () => {
        problem.textContent = ''
        let parsed
        try { parsed = JSON.parse(box.value) } catch (err) { problem.textContent = `that is not readable json: ${err.message}`; return }
        try {
          const saved = await api('/api/themes', { method: 'POST', body: parsed })
          await reloadThemes()
          await useTheme(saved.theme.id)
          toast(`${saved.theme.label} added`)
          renderThemes()
        } catch (err) { problem.textContent = err.message }
      },
    }),
    el('button', { class: 'ghost', text: 'back', onclick: renderThemes })))
}

// ---------------------------------------------------------------- editor state

let saveTimer
function touch() {
  $('save-state').textContent = 'saving…'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 600)
}

async function save() {
  clearTimeout(saveTimer)
  const wf = state.wf
  if (!wf) return null
  try {
    const saved = wf.id
      ? await api(`/api/workflows/${wf.id}`, { method: 'PUT', body: wf })
      : await api('/api/workflows', { method: 'POST', body: wf })
    wf.id = saved.id
    state.workflows = await api('/api/workflows')
    $('save-state').textContent = 'saved'
    setTimeout(() => { if ($('save-state').textContent === 'saved') $('save-state').textContent = '' }, 1400)
  } catch (err) {
    $('save-state').textContent = ''
    toast(err.message, true)
  }
  return wf
}

async function openWorkflow(id) {
  state.wf = await api(`/api/workflows/${id}`)
  state.selected = null
  state.run = null
  showView('editor')
  setActiveButton(Boolean(state.wf.active))
  renderCrumbs()
  renderCanvas()
  renderInspector()
  state.runs = await api('/api/runs')
  renderRunPicker()
  renderRun(null)
}

// "on" on its own never said on what. This says whether the automation runs by
// itself, which is the thing people are actually deciding.
function setActiveButton(on) {
  const button = $('active')
  button.classList.toggle('on', on)
  button.setAttribute('aria-pressed', String(on))
  $('active-label').textContent = on ? 'live' : 'not live'
}

$('active').onclick = () => {
  state.wf.active = !state.wf.active
  setActiveButton(state.wf.active)
  toast(state.wf.active ? 'live' : 'not live')
  touch()
}

$('save-as').onclick = async () => {
  const name = prompt('save a copy as', `${state.wf.name} copy`)
  if (name === null) return
  const folder = prompt('into which folder? (blank for none)', state.wf.folder ?? '')
  if (folder === null) return
  const copy = await api('/api/workflows', {
    method: 'POST',
    body: { ...state.wf, id: null, name: name.trim() || state.wf.name, folder: folder.trim(), active: false },
  })
  state.workflows = await api('/api/workflows')
  toast(`saved as ${copy.name}`)
  openWorkflow(copy.id)
}

function nodeById(id) {
  return state.wf.nodes.find((n) => n.id === id)
}

function selectNode(id) {
  state.selected = id
  for (const node of document.querySelectorAll('.node')) node.classList.toggle('selected', node.dataset.id === id)
  renderInspector()
}

function addNode(type, x, y) {
  const def = state.defs.get(type)
  const node = {
    id: `n${Math.random().toString(36).slice(2, 9)}`,
    type,
    name: '',
    params: Object.fromEntries((def.params ?? []).map((p) => [p.key, structuredClone(p.default ?? '')])),
    position: { x: Math.round(x), y: Math.round(y) },
  }
  state.wf.nodes.push(node)
  renderCanvas()
  selectNode(node.id)
  touch()
  return node
}

function removeNode(id) {
  state.wf.nodes = state.wf.nodes.filter((n) => n.id !== id)
  state.wf.edges = state.wf.edges.filter((e) => e.from !== id && e.to !== id)
  if (state.selected === id) state.selected = null
  renderCanvas()
  renderInspector()
  touch()
}

function connect(from, fromPort, to) {
  if (from === to) return toast('a step cannot feed itself.', true)
  if (state.wf.edges.some((e) => e.from === from && e.fromPort === fromPort && e.to === to)) return
  state.wf.edges.push({ from, fromPort, to, toPort: 'main' })
  renderCanvas()
  touch()
}

// ---------------------------------------------------------------- palette

const CATEGORY_ORDER = ['trigger', 'logic', 'transform', 'web3', 'action', 'output']
const CATEGORY_LABEL = {
  trigger: 'triggers', action: 'services', logic: 'logic',
  transform: 'transform', output: 'output', web3: 'onchain',
}

function stepItem(def) {
  const service = serviceOf(def)
  const item = el('div', { class: 'palette-item' },
    service ? logoEl(service, 18) : null,
    el('div', { class: 'palette-text' },
      el('div', { text: def.label }),
      el('small', { text: def.description ?? '' })))
  item.dataset.type = def.type
  item.title = 'drag onto the canvas, or click'
  return item
}

// Steps from services are behind their service rather than poured into one long
// list: fifteen services times three actions each is not a list anybody reads.
function renderPalette() {
  const host = $('palette')
  if (!host) return
  const term = ($('palette-search')?.value ?? '').trim().toLowerCase()
  host.textContent = ''

  const all = [...state.defs.values()]

  if (term) {
    const hits = all.filter((def) =>
      `${def.label} ${def.type} ${def.description ?? ''} ${serviceOf(def) ?? ''}`.toLowerCase().includes(term))
    host.append(el('h4', { text: `${hits.length} step${hits.length === 1 ? '' : 's'} matching` }))
    for (const def of hits.sort((a, b) => a.label.localeCompare(b.label))) host.append(stepItem(def))
    if (!hits.length) host.append(el('p', { class: 'hint', text: 'no match.' }))
    return
  }

  // One row per service, opening onto its own steps. Fifteen services with two
  // or three steps each is a list nobody reads if it is poured out flat.
  const services = new Map()
  for (const def of all) {
    const id = serviceOf(def)
    if (!id) continue
    if (!services.has(id)) services.set(id, [])
    services.get(id).push(def)
  }

  if (services.size) {
    host.append(el('h4', { text: 'services' }))
    for (const [id, defs] of [...services].sort((a, b) => a[0].localeCompare(b[0]))) {
      host.append(serviceRow(id, defs))
    }
  }

  const byCategory = new Map()
  for (const def of all) {
    if (serviceOf(def)) continue
    if (!byCategory.has(def.category)) byCategory.set(def.category, [])
    byCategory.get(def.category).push(def)
  }
  const rank = (c) => (CATEGORY_ORDER.indexOf(c) === -1 ? 99 : CATEGORY_ORDER.indexOf(c))
  for (const category of [...byCategory.keys()].sort((a, b) => rank(a) - rank(b))) {
    host.append(el('h4', { text: CATEGORY_LABEL[category] ?? category }))
    for (const def of byCategory.get(category).sort((a, b) => a.label.localeCompare(b.label))) {
      host.append(stepItem(def))
    }
  }
}

function serviceRow(id, defs) {
  const spec = state.integrations.find((i) => i.id === id)
  const label = spec?.label ?? SERVICE_LABEL[id] ?? state.credentialTypes.get(id)?.label ?? id.charAt(0).toUpperCase() + id.slice(1)
  const open = state.paletteService === id

  const row = el('button', {
    class: `service-row${open ? ' open' : ''}`,
    onclick: () => { state.paletteService = open ? null : id; renderPalette() },
  },
    logoEl(id, 22),
    el('span', { class: 'service-name', text: label }),
    el('span', { class: 'service-count', text: `${defs.length}` }),
    el('span', { class: 'chevron', text: open ? '\u2013' : '+' }))

  const wrap = el('div', { class: 'service-block' }, row)
  if (!open) return wrap

  const credType = defs.map((d) => (d.params ?? []).find((p) => p.type === 'credential')?.credentialType).find(Boolean)
  if (credType) {
    const saved = state.credentials.filter((c) => c.type === credType)
    wrap.append(el('div', { class: 'service-note hint' }, saved.length
      ? `key: ${saved.map((c) => c.name).join(', ')}`
      : el('span', {}, `no ${label} key yet. `,
          el('a', { href: '#', onclick: (e) => { e.preventDefault(); openKeysTab(credType) }, text: 'add one' }))))
  }

  // inside Discord, a label like "Post to Discord" is saying the word twice
  const strip = new RegExp(`\\s*(to|from|a|an)?\\s*\\b${label}\\b\\s*`, 'i')
  for (const def of defs.sort((a, b) => a.label.localeCompare(b.label))) {
    const short = def.label.replace(strip, ' ').replace(/\s+/g, ' ').trim()
    wrap.append(stepItem({ ...def, label: short ? short.charAt(0).toUpperCase() + short.slice(1) : def.label }))
  }
  return wrap
}

$('palette-search').oninput = renderPalette

function openKeysTab(credentialType) {
  // the draft type has to be set before the tab renders, not after
  state.keyDraftType = credentialType ?? null
  const tab = document.querySelector('.tab[data-tab="keys"]')
  if (tab) tab.click()
  else renderKeysInto($('tab-keys'))
}

// ---------------------------------------------------------------- canvas

const world = () => $('world')
const wireLayer = () => $('wire-layer')

function outPorts(node) {
  const ports = [...(state.defs.get(node.type)?.outputs ?? ['main'])]
  if (node.onError === 'errorOutput' && !ports.includes('error')) ports.push('error')
  return ports
}

function portPoint(node, port) {
  if (port === null) return { x: node.position.x, y: node.position.y + IN_Y }
  const i = Math.max(0, outPorts(node).indexOf(port))
  return { x: node.position.x + NODE_W, y: node.position.y + OUT_Y + i * OUT_STEP }
}

function applyView() {
  const { x, y, k } = state.viewBox
  world().style.transform = `translate(${x}px, ${y}px) scale(${k})`
  wireLayer().setAttribute('transform', `translate(${x} ${y}) scale(${k})`)
}

function toWorld(clientX, clientY) {
  const box = $('canvas').getBoundingClientRect()
  const { x, y, k } = state.viewBox
  return { x: (clientX - box.left - x) / k, y: (clientY - box.top - y) / k }
}

function renderCanvas() {
  const host = world()
  host.textContent = ''
  for (const node of state.wf.nodes) {
    const def = state.defs.get(node.type)
    const box = el('div', { class: 'node' })
    box.dataset.id = node.id
    box.style.left = `${node.position.x}px`
    box.style.top = `${node.position.y}px`
    if (node.id === state.selected) box.classList.add('selected')
    const service = def ? serviceOf(def) : null
    box.append(el('div', { class: 'node-head' },
      service ? logoEl(service, 16) : null,
      el('div', { class: 'title', text: node.name || def?.label || node.type })))
    box.append(el('div', { class: 'type', text: def ? def.type : `${node.type} — not installed` }))

    // a step that authenticates says whose key it is using, on the card itself,
    // because "post to discord" on its own never answers "as who?"
    const credParam = (def?.params ?? []).find((p) => p.type === 'credential' && p.key === 'credential')
    if (credParam) {
      const chosen = node.params[credParam.key]
      box.append(chosen
        ? el('div', { class: 'node-key', text: `as ${chosen}` })
        : el('div', { class: 'node-key missing', text: 'no key chosen' }))
    }

    if (def?.category !== 'trigger') {
      const input = el('div', { class: 'port in' })
      input.dataset.node = node.id
      box.append(input)
    }
    const ports = outPorts(node)
    ports.forEach((port, i) => {
      const dot = el('div', { class: `port out${port === 'error' ? ' error' : ''}` })
      dot.dataset.node = node.id
      dot.dataset.port = port
      dot.style.top = `${20 + i * OUT_STEP}px`
      box.append(dot)
      if (ports.length > 1) {
        const label = el('div', { class: 'port-label', text: port })
        label.style.top = `${18 + i * OUT_STEP}px`
        box.append(label)
      }
    })
    host.append(box)
  }
  drawWires()
  applyView()
  $('empty-hint').style.display = state.wf.nodes.length ? 'none' : 'grid'
}

function bezier(a, b) {
  const dx = Math.max(40, Math.abs(b.x - a.x) / 2)
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`
}

function drawWires(temp = null) {
  const layer = wireLayer()
  layer.textContent = ''
  const NS = 'http://www.w3.org/2000/svg'

  for (const edge of state.wf.edges) {
    const from = nodeById(edge.from)
    const to = nodeById(edge.to)
    if (!from || !to) continue
    const d = bezier(portPoint(from, edge.fromPort), portPoint(to, null))

    const hit = document.createElementNS(NS, 'path')
    hit.setAttribute('d', d)
    hit.setAttribute('stroke', 'transparent')
    hit.setAttribute('stroke-width', '14')
    hit.setAttribute('fill', 'none')
    hit.style.cursor = 'pointer'

    const line = document.createElementNS(NS, 'path')
    line.setAttribute('d', d)
    line.setAttribute('stroke', themeColor('--wire'))
    line.setAttribute('stroke-width', '2')
    line.setAttribute('fill', 'none')

    hit.addEventListener('mouseenter', () => line.setAttribute('stroke', themeColor('--bad')))
    hit.addEventListener('mouseleave', () => line.setAttribute('stroke', themeColor('--wire')))
    hit.addEventListener('click', () => {
      state.wf.edges = state.wf.edges.filter((e) => e !== edge)
      renderCanvas()
      touch()
      toast('connection removed')
    })

    const group = document.createElementNS(NS, 'g')
    group.append(hit, line)
    layer.append(group)
  }

  if (temp) {
    const line = document.createElementNS(NS, 'path')
    line.setAttribute('d', bezier(temp.a, temp.b))
    line.setAttribute('stroke', themeColor('--wire-hot'))
    line.setAttribute('stroke-width', '2')
    line.setAttribute('stroke-dasharray', '5 4')
    line.setAttribute('fill', 'none')
    layer.append(line)
  }
}

let drag = null

// Clicking adds the step in the middle of the canvas; dragging puts it where
// you let go. Both, because a click that does nothing reads as a broken button.
$('palette').addEventListener('click', (event) => {
  const item = event.target.closest('.palette-item')
  if (!item || item.dataset.dragged === 'yes') return
  const box = $('canvas').getBoundingClientRect()
  const at = toWorld(box.left + box.width / 2, box.top + box.height / 2)
  addNode(item.dataset.type, at.x - NODE_W / 2, at.y - 20)
  toast('added')
})

$('palette').addEventListener('pointerdown', (event) => {
  const item = event.target.closest('.palette-item')
  if (!item) return
  event.preventDefault()
  item.dataset.dragged = 'no'
  drag = { kind: 'palette', type: item.dataset.type, item, startX: event.clientX, startY: event.clientY, node: null }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp, { once: true })
})

$('canvas').addEventListener('pointerdown', (event) => {
  const port = event.target.closest('.port')
  if (port?.classList.contains('out')) {
    port.classList.add('armed')
    const node = nodeById(port.dataset.node)
    drag = { kind: 'link', from: node.id, fromPort: port.dataset.port, port, a: portPoint(node, port.dataset.port) }
  } else {
    const box = event.target.closest('.node')
    if (box) {
      const node = nodeById(box.dataset.id)
      selectNode(node.id)
      const start = toWorld(event.clientX, event.clientY)
      drag = { kind: 'node', id: node.id, dx: start.x - node.position.x, dy: start.y - node.position.y, moved: false }
    } else {
      selectNode(null)
      drag = { kind: 'pan', startX: event.clientX, startY: event.clientY, ox: state.viewBox.x, oy: state.viewBox.y }
      $('canvas').classList.add('panning')
    }
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp, { once: true })
})

function onMove(event) {
  if (!drag) return
  if (drag.kind === 'palette') {
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return
    // while the pointer is still over the palette there is nowhere sensible to
    // put it, so it starts in the middle and follows the pointer from there
    const box = $('canvas').getBoundingClientRect()
    const inside = event.clientX > box.left
    const at = inside
      ? toWorld(event.clientX, event.clientY)
      : toWorld(box.left + box.width / 2, box.top + box.height / 2)
    if (drag.item) drag.item.dataset.dragged = 'yes'
    const created = addNode(drag.type, at.x - NODE_W / 2, at.y - 20)
    drag = { kind: 'node', id: created.id, dx: NODE_W / 2, dy: 20, moved: true }
    return
  }
  if (drag.kind === 'node') {
    const at = toWorld(event.clientX, event.clientY)
    const node = nodeById(drag.id)
    node.position = { x: Math.round(at.x - drag.dx), y: Math.round(at.y - drag.dy) }
    const box = document.querySelector(`.node[data-id="${node.id}"]`)
    box.style.left = `${node.position.x}px`
    box.style.top = `${node.position.y}px`
    drag.moved = true
    drawWires()
    return
  }
  if (drag.kind === 'link') {
    drawWires({ a: drag.a, b: toWorld(event.clientX, event.clientY) })
    return
  }
  if (drag.kind === 'pan') {
    state.viewBox.x = drag.ox + (event.clientX - drag.startX)
    state.viewBox.y = drag.oy + (event.clientY - drag.startY)
    applyView()
  }
}

function onUp(event) {
  window.removeEventListener('pointermove', onMove)
  $('canvas').classList.remove('panning')
  if (!drag) return
  if (drag.kind === 'link') {
    drag.port.classList.remove('armed')
    const target = document.elementFromPoint(event.clientX, event.clientY)
    const input = target?.closest('.port.in') || target?.closest('.node')?.querySelector('.port.in')
    if (input) connect(drag.from, drag.fromPort, input.dataset.node)
    else drawWires()
  }
  if (drag.kind === 'node' && drag.moved) touch()
  drag = null
}

$('canvas').addEventListener('wheel', (event) => {
  event.preventDefault()
  const box = $('canvas').getBoundingClientRect()
  const next = Math.min(2, Math.max(0.35, state.viewBox.k * Math.exp(-event.deltaY * 0.0015)))
  const px = event.clientX - box.left
  const py = event.clientY - box.top
  state.viewBox.x = px - (px - state.viewBox.x) * (next / state.viewBox.k)
  state.viewBox.y = py - (py - state.viewBox.y) * (next / state.viewBox.k)
  state.viewBox.k = next
  applyView()
}, { passive: false })

window.addEventListener('keydown', (event) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
  if (typing || state.view !== 'editor' || !state.selected) return
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    removeNode(state.selected)
  }
})

// ---------------------------------------------------------------- inspector

function field(label, control, description) {
  return el('div', { class: 'field' },
    el('label', { text: label }),
    control,
    description ? el('div', { class: 'desc', text: description }) : null)
}

function keyValueControl(rows, onChange) {
  const host = el('div')
  const list = Array.isArray(rows) ? rows : []
  const redraw = () => {
    host.textContent = ''
    list.forEach((row, i) => {
      const name = el('input', { type: 'text', placeholder: 'name', value: row.name ?? '' })
      const value = el('input', { type: 'text', placeholder: 'value', value: row.value ?? '' })
      name.oninput = () => { list[i].name = name.value; onChange(list) }
      value.oninput = () => { list[i].value = value.value; onChange(list) }
      host.append(el('div', { class: 'kv-row' }, name, value,
        el('button', { class: 'ghost', text: '×', onclick: () => { list.splice(i, 1); onChange(list); redraw() } })))
    })
    host.append(el('button', { class: 'ghost', text: '+ add', onclick: () => { list.push({ name: '', value: '' }); onChange(list); redraw() } }))
  }
  redraw()
  return host
}

function listControl(rows, onChange) {
  const host = el('div')
  const list = Array.isArray(rows) ? rows : []
  const redraw = () => {
    host.textContent = ''
    list.forEach((row, i) => {
      const value = el('input', { type: 'text', placeholder: `value ${i + 1}`, value: row ?? '' })
      value.oninput = () => { list[i] = value.value; onChange(list) }
      host.append(el('div', { class: 'kv-row list-row' }, value,
        el('button', { class: 'ghost', text: '×', onclick: () => { list.splice(i, 1); onChange(list); redraw() } })))
    })
    host.append(el('button', { class: 'ghost', text: '+ add', onclick: () => { list.push(''); onChange(list); redraw() } }))
  }
  redraw()
  return host
}

function visible(param, params) {
  if (!param.showWhen) return true
  return Object.entries(param.showWhen).every(([key, want]) => {
    const value = params[key]
    return Array.isArray(want) ? want.includes(value) : value === want
  })
}

function renderInspector() {
  const host = $('inspector')
  host.textContent = ''
  const node = state.selected && state.wf ? nodeById(state.selected) : null
  if (!node) {
    $('inspector-title').textContent = 'nothing selected'
    return
  }
  const def = state.defs.get(node.type)
  $('inspector-title').textContent = def?.label ?? node.type
  if (def?.description) host.append(el('p', { class: 'hint', text: def.description }))

  const service = def ? serviceOf(def) : null
  const spec = service ? state.integrations.find((i) => i.id === service) : null
  if (spec?.hosts?.length) {
    const tags = el('div', { style: 'margin:-2px 0 12px' })
    tags.append(el('span', { class: 'hint', text: 'contacts  ' }))
    for (const h of spec.hosts) tags.append(el('span', { class: 'tag', text: h }))
    host.append(tags)
  }

  const name = el('input', { type: 'text', value: node.name ?? '', placeholder: def?.label ?? node.type })
  name.oninput = () => {
    node.name = name.value
    document.querySelector(`.node[data-id="${node.id}"] .title`).textContent = node.name || def?.label || node.type
    touch()
  }
  host.append(field('name on the canvas', name))

  for (const param of def?.params ?? []) {
    if (!visible(param, node.params)) continue
    const value = node.params[param.key]
    const set = (next) => { node.params[param.key] = next; touch() }
    let control

    if (param.type === 'select') {
      control = el('select')
      for (const option of param.options ?? []) control.append(new Option(option.label ?? option, option.value ?? option))
      control.value = value ?? ''
      control.onchange = () => { set(control.value); renderInspector() }
    } else if (param.type === 'boolean') {
      control = el('input', { type: 'checkbox', checked: Boolean(value) })
      control.onchange = () => { set(control.checked); renderInspector() }
    } else if (param.type === 'datetime') {
      control = el('input', { type: 'datetime-local', value: value ?? '' })
      control.oninput = () => set(control.value)
    } else if (param.type === 'number') {
      control = el('input', { type: 'number', value: value ?? '' })
      if (param.min !== undefined) control.min = param.min
      control.oninput = () => set(control.value === '' ? '' : Number(control.value))
    } else if (param.type === 'textarea' || param.type === 'code') {
      control = el('textarea', { rows: param.type === 'code' ? 10 : 4, value: value ?? '' })
      control.oninput = () => set(control.value)
    } else if (param.type === 'keyvalue') {
      control = keyValueControl(value, set)
    } else if (param.type === 'list') {
      control = listControl(value, set)
    } else if (param.type === 'credential') {
      control = el('select')
      control.append(new Option('— pick a saved key —', ''))
      const matching = state.credentials.filter((c) => !param.credentialType || c.type === param.credentialType)
      for (const cred of matching) control.append(new Option(`${cred.name} · ${typeLabel(cred.type)}`, cred.name))
      control.value = value ?? ''
      control.onchange = () => { set(control.value); renderCanvas(); selectNode(node.id) }

      if (!matching.length) {
        const wanted = param.credentialType ? typeLabel(param.credentialType) : 'key'
        const add = el('button', {
          class: 'ghost', text: `add a ${wanted} key`,
          onclick: () => { openKeysTab(param.credentialType) },
        })
        host.append(field(param.label, el('div', {}, control, add),
          `no ${wanted} key yet.`))
        continue
      }
      host.append(field(param.label, control,
        param.description ?? 'the account this runs as.'))
      continue
    } else {
      control = el('input', { type: 'text', placeholder: param.placeholder ?? '', value: value ?? '' })
      control.oninput = () => set(control.value)
    }
    host.append(field(param.label, control, param.description))
  }

  host.append(el('div', { class: 'panel-title', style: 'margin-top:18px', text: 'when it fails' }))

  const onError = el('select')
  for (const [value, label] of [
    ['stop', 'stop this branch'],
    ['continue', 'carry on, with the error attached'],
    ['errorOutput', 'send it down an error wire'],
  ]) onError.append(new Option(label, value))
  onError.value = node.onError ?? 'stop'
  onError.onchange = () => {
    node.onError = onError.value
    touch()
    renderCanvas()
    selectNode(node.id)
  }
  host.append(field('if this step fails', onError))

  const retries = el('input', { type: 'number', min: 0, max: 5, value: node.retries ?? 0 })
  retries.oninput = () => { node.retries = Math.min(5, Math.max(0, Number(retries.value) || 0)); touch() }
  host.append(field('try again', retries, 'how many extra attempts before it counts as failed.'))

  if ((node.retries ?? 0) > 0) {
    const wait = el('input', { type: 'number', min: 0, value: Math.round((node.retryWait ?? 2000) / 1000) })
    wait.oninput = () => { node.retryWait = Math.max(0, Number(wait.value) || 0) * 1000; touch() }
    host.append(field('wait between tries (seconds)', wait))
  }

  host.append(el('button', { class: 'ghost', style: 'margin-top:16px', text: 'delete step', onclick: () => removeNode(node.id) }))
}

// ---------------------------------------------------------------- runs

function setNodeStatus(id, status) {
  const box = document.querySelector(`.node[data-id="${id}"]`)
  if (!box) return
  box.classList.remove('status-ok', 'status-error', 'status-skipped', 'status-running')
  if (status) box.classList.add(`status-${status}`)
}

function renderRun(run) {
  state.run = run
  const body = $('run-body')
  body.textContent = ''
  if (!run) {
    $('run-summary').textContent = ''
    return
  }
  const failed = Object.values(run.nodes).filter((n) => n.status === 'error').length
  $('run-summary').textContent = run.error
    ? run.error
    : `${run.status === 'ok' ? 'finished' : 'finished with problems'} · ${Object.keys(run.nodes).length} steps${failed ? ` · ${failed} failed` : ''}`

  for (const [id, result] of Object.entries(run.nodes)) {
    const node = state.wf.nodes.find((n) => n.id === id)
    const def = node && state.defs.get(node.type)
    const out = Object.entries(result.itemsOut ?? {}).map(([port, n]) => `${port} ${n}`).join(', ')
    const row = el('div', { class: 'run-node' },
      el('div', { class: 'head' },
        el('span', { class: 'name', text: node?.name || def?.label || id }),
        el('span', { class: `badge ${result.status}`, text: result.status }),
        el('span', { class: 'hint', text: result.status === 'skipped'
          ? (result.reason ?? '')
          : `in ${result.itemsIn}${out ? ` · out ${out}` : ''} · ${result.ms}ms` })))
    for (const line of result.logs ?? []) row.append(el('div', { class: 'msg', text: line.message }))
    if (result.error) row.append(el('div', { class: 'msg bad', text: result.error }))
    body.append(row)
  }
}

function renderRunPicker() {
  const picker = $('run-picker')
  picker.textContent = ''
  const mine = state.runs.filter((r) => r.workflowId === state.wf?.id)
  if (!mine.length) {
    picker.append(new Option('no runs yet', ''))
    return
  }
  for (const run of mine) {
    picker.append(new Option(`${new Date(run.startedAt).toLocaleTimeString()} · ${run.status}`, run.runId))
  }
  if (state.run) picker.value = state.run.runId
}

$('run').onclick = async () => {
  await save()
  const triggers = state.wf.nodes.filter((n) => state.defs.get(n.type)?.category === 'trigger')
  if (!triggers.length) return toast('add a trigger step first.', true)
  const selected = state.selected ? nodeById(state.selected) : null
  const trigger = (selected && state.defs.get(selected.type)?.category === 'trigger') ? selected : triggers[0]

  for (const box of document.querySelectorAll('.node')) setNodeStatus(box.dataset.id, null)
  $('drawer').classList.add('open')
  $('run-summary').textContent = 'running…'
  try {
    const run = await api(`/api/workflows/${state.wf.id}/run`, { method: 'POST', body: { triggerNodeId: trigger.id } })
    state.runs = await api('/api/runs')
    renderRunPicker()
    renderRun(run)
    for (const [id, result] of Object.entries(run.nodes)) setNodeStatus(id, result.status === 'ok' ? 'ok' : result.status)
  } catch (err) {
    toast(err.message, true)
    $('run-summary').textContent = err.message
  }
}

$('drawer-toggle').onclick = () => $('drawer').classList.toggle('open')
$('run-picker').onchange = async (event) => {
  if (event.target.value) renderRun(await api(`/api/runs/${event.target.value}`))
}

const events = new EventSource('/api/events')
events.onmessage = (message) => {
  const event = JSON.parse(message.data)
  if (state.view !== 'editor') return
  if (event.type === 'node:start') setNodeStatus(event.nodeId, 'running')
  if (event.type === 'node:end') setNodeStatus(event.nodeId, event.status === 'ok' ? 'ok' : event.status)
  if (event.type === 'node:log') {
    $('run-body').append(el('div', { class: 'log-line', text: event.message }))
    $('run-body').scrollTop = $('run-body').scrollHeight
  }
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.onclick = () => {
    for (const other of document.querySelectorAll('.tab')) other.classList.toggle('active', other === tab)
    $('tab-steps').hidden = tab.dataset.tab !== 'steps'
    $('tab-keys').hidden = tab.dataset.tab !== 'keys'
    if (tab.dataset.tab === 'keys') renderKeysInto($('tab-keys'))
  }
}

// ---------------------------------------------------------------- boot

const boot = await api('/api/state')
state.defs = new Map(boot.nodes.map((d) => [d.type, d]))
state.credentialTypes = new Map(boot.credentialTypes.map((t) => [t.type, t]))
state.integrations = boot.integrations
state.credentials = boot.credentials
state.workflows = boot.workflows
state.runs = boot.runs
state.workspace = boot.workspace
state.themes = boot.themes ?? []
state.home = { port: boot.port, path: boot.home }
applyTheme(currentTheme())

renderPalette()
showView('home')

if (boot.problems?.length) {
  $('palette-problems').textContent = boot.problems.map((p) => `${p.file}: ${p.message}`).join('\n')
}
