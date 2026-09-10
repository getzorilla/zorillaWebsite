'use client'

import { useState } from 'react'

export default function AgentDoc({ text }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div>
      <div className="row wrap" style={{ marginBottom: 12 }}>
        <button className="btn primary" onClick={copy}>{copied ? 'copied' : 'copy the whole thing'}</button>
        <a className="btn" href="/zorilla.md" download="zorilla.md">download zorilla.md</a>
        <span className="dimmer" style={{ fontSize: 12 }}>{(text.length / 1000).toFixed(0)}k characters</span>
      </div>
      <pre className="doc-block">{text}</pre>
    </div>
  )
}
