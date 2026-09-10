'use client'

import { useState } from 'react'

const LOGOS = new Set([
  'airtable', 'anthropic', 'coingecko', 'deepseek', 'discord', 'etherscan', 'gemini',
  'gmail', 'notion', 'openai', 'resend', 'slack', 'stripe', 'supabase', 'telegram',
  'twilio', 'web3', 'x',
])

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
  if (!fields.length) return 'nothing to set up'
  // a label that already says "your" should not get another one
  const labels = fields.map((f) => f.label.toLowerCase().replace(/^your /, ''))
  if (labels.length === 1) return `you need your ${labels[0]}`
  return `you need your ${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
}

export default function IntegrationGrid({ integrations, steps }) {
  const [copied, setCopied] = useState('')
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
      <input
        className="int-search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="search: email, chat, database, chain…"
      />
      <p className="dimmer" style={{ fontSize: 12.5, margin: '0 0 18px' }}>
        {shown.length} of {integrations.length}
      </p>

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
                      {action.poll && <em>waits</em>}
                      <small>{action.description || action.label}</small>
                    </span>
                    <button
                      className="btn quiet"
                      onClick={() => copy(action.type, Object.fromEntries((action.params ?? []).map((p) => [p.key, p.default ?? ''])))}
                    >
                      {copied === action.type ? 'copied' : 'copy'}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="int-foot">
                <span>{needs(spec)}</span>
                <span>{(spec.hosts ?? []).map((h) => h.replace(/^a web address you provide.*/, 'an address you provide')).join(', ')}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
