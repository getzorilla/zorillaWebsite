'use client'

import { useState } from 'react'

// Adding a service should not mean learning a file format. Copy this, tell an
// assistant which service you want, paste back what it writes.
export default function IntegrationPrompt({ prompt }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="panel" style={{ maxWidth: '64ch' }}>
      <h3>a service that is not here</h3>
      <p style={{ fontSize: 13, marginBottom: 12 }}>
        An integration is one JSON file, and you do not have to write it. Copy this prompt,
        replace the service name, hand it to Claude or ChatGPT, and paste the answer into
        <b> create integration</b> in your zorilla. It is checked before it saves.
      </p>
      <div className="row wrap">
        <button className="btn primary" onClick={copy}>{copied ? 'copied' : 'copy the prompt'}</button>
        <a className="btn" href="/integration-prompt.md" download="zorilla-integration-prompt.md">download it</a>
      </div>
    </div>
  )
}
