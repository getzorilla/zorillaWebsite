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
// deciding whether zorilla covers what they use should be able to answer that
// on one page.
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
                <span>{spec.fields?.length ? `key: ${spec.fields.map((f) => f.label).join(', ')}` : 'no key needed'}</span>
                <span>{spec.hosts?.join(', ')}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
