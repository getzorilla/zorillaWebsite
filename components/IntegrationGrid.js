'use client'

import catalog from '@/public/catalog.json'
import { useState } from 'react'
import Preview from './Preview'

// which marks exist is decided by the app's logo folder, copied here on sync
const LOGOS = new Set(catalog.logos ?? [])

function Logo({ id, size = 26 }) {
  if (!LOGOS.has(id)) {
    return <span className="int-logo letter" style={{ width: size, height: size }}>{id.charAt(0).toUpperCase()}</span>
  }
  return <img className="int-logo" src={`/editor/logos/${id}.svg`} alt="" width={size} height={size} />
}

// Everything a service can do, with the line to paste for each one. Somebody
// deciding whether Zorilla covers what they use should be able to answer that
// on one page.
// What somebody has to go and find before this is any use, said the way they
// would say it rather than as a list of field names.
function needs(spec) {
  const fields = (spec.fields ?? []).filter((f) => f.required !== false)
  if (!fields.length) return 'Nothing to set up'
  // a label that already says "your" should not get another one
  const labels = fields.map((f) => f.label.toLowerCase().replace(/^your /, ''))
  if (labels.length === 1) return `You need your ${labels[0]}`
  return `You need your ${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
}

export default function IntegrationGrid({ integrations, steps, prompt }) {
  const [copied, setCopied] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [term, setTerm] = useState('')

  const copy = async (type, params) => {
    const node = { id: type.split('.')[1] ?? 'step', type, params }
    await navigator.clipboard.writeText(JSON.stringify(node, null, 2))
    setCopied(type)
    setTimeout(() => setCopied(''), 1500)
  }

  const hit = (spec) => {
    const words = term.trim().toLowerCase()
    if (!words) return true
    const actions = steps.filter((s) => s.integration === spec.id).map((s) => s.label).join(' ')
    return `${spec.label} ${spec.description} ${actions}`.toLowerCase().includes(words)
  }

  const shown = integrations.filter(hit)

  return (
    <>
      <div className="int-searchrow">
        <input
          className="int-search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search: email, chat, database, chain…"
        />
        {prompt && (
          <button className="btn" onClick={() => setShowPrompt(true)}>Agent Prompt</button>
        )}
      </div>
      <p className="dimmer" style={{ fontSize: 12.5, margin: '0 0 18px' }}>
        {shown.length} of {integrations.length}
      </p>

      {showPrompt && (
        <div className="prompt-over" onClick={(e) => { if (e.target === e.currentTarget) setShowPrompt(false) }}>
          <div className="prompt-card">
            <div className="prompt-head">
              <div>
                <strong>Build your own</strong>
                <p>Copy this, name the service, and paste back the JSON you get.</p>
              </div>
              <button className="btn quiet" onClick={() => setShowPrompt(false)}>Close</button>
            </div>
            <Preview title="zorilla-integration-prompt.md" text={prompt} filename="zorilla-integration-prompt.md" />
          </div>
        </div>
      )}

      <div className="int-grid">
        {shown.map((spec) => {
          const actions = steps.filter((s) => s.integration === spec.id)
          return (
            <div className="int-card" key={spec.id} id={spec.id}>
              <div className="int-head">
                <Logo id={spec.id} />
                <div>
                  <strong>{spec.label}</strong>
                  <small>{spec.description}</small>
                </div>
              </div>

              <ul className="int-actions">
                {actions.map((action) => (
                  <li key={action.type}>
                    <span>
                      <code>{action.type}</code>
                      {action.poll && <em>Waits</em>}
                      <small>{action.description || action.label}</small>
                    </span>
                    <button
                      className="btn quiet"
                      onClick={() => copy(action.type, Object.fromEntries((action.params ?? []).map((p) => [p.key, p.default ?? ''])))}
                    >
                      {copied === action.type ? 'Copied' : 'Copy'}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="int-foot">
                <span>{needs(spec)}</span>
                <span>
                  Sends requests to{' '}
                  {(spec.hosts ?? [])
                    .map((h) => h.replace(/^a web address you provide.*/, 'An address you provide'))
                    .join(', ')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
