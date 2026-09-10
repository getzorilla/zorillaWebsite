'use client'

import Preview from './Preview'

export default function AgentDoc({ text }) {
  return (
    <div>
      <Preview title={`zorilla.md · ${(text.length / 1000).toFixed(0)}k characters`} text={text} filename="zorilla.md">
        <pre className="doc-block">{text}</pre>
      </Preview>
    </div>
  )
}
