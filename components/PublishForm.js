'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishForm() {
  const router = useRouter()
  const [form, setForm] = useState({ kind: 'automation', title: '', summary: '', pkg: '' })
  const [derived, setDerived] = useState(null)
  const [problem, setProblem] = useState('')

  const set = (key) => (event) => { setForm({ ...form, [key]: event.target.value }); setDerived(null) }

  const readFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setForm({ ...form, pkg: text, title: form.title || file.name.replace(/\.json$/, '') })
    setDerived(null)
  }

  const publish = async () => {
    setProblem('')
    const result = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: form.kind, title: form.title, summary: form.summary, package: form.pkg }),
    }).then((r) => r.json())

    if (result.error) return setProblem(result.error)
    router.push(`/marketplace/${result.slug}`)
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <div className="field">
        <label>What is it</label>
        <select value={form.kind} onChange={set('kind')}>
          <option value="automation">An automation</option>
          <option value="integration">An integration</option>
          <option value="theme">A theme</option>
        </select>
      </div>
      <div className="field">
        <label>Name</label>
        <input value={form.title} onChange={set('title')} placeholder="ETH price alert" />
      </div>
      <div className="field">
        <label>One line about it</label>
        <input value={form.summary} onChange={set('summary')} placeholder="Emails you when ETH crosses a price you pick" />
      </div>
      <div className="field">
        <label>The exported file</label>
        <input type="file" accept="application/json" onChange={readFile} style={{ marginBottom: 8 }} />
        <textarea rows={12} value={form.pkg} onChange={set('pkg')} placeholder="Or paste the JSON here" spellCheck={false} />
        <div className="help">
          {form.kind === 'theme'
            ? 'Copy a theme in the app (themes, copy this one), change the hex values, paste it here.'
            : null}
        </div>
        <div className="help">
          Keys are never part of an exported file. It names them, and binds to the
          installer&apos;s own keys of those names.
        </div>
      </div>
      <div className="row">
        <button className="btn primary" onClick={publish}>Publish</button>
      </div>
      {problem && <p style={{ color: 'var(--bad)', fontSize: 13 }}>{problem}</p>}
    </div>
  )
}
