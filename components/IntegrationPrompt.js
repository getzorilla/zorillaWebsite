'use client'

import Preview from './Preview'

// Adding a service should not mean learning a file format. Copy this, tell an
// assistant which service you want, paste back what it writes.
export default function IntegrationPrompt({ prompt }) {
  return (
    <div className="panel" style={{ maxWidth: '64ch' }}>
      <h3>Build your own</h3>
      <Preview title="Prompt:" text={prompt} filename="zorilla-integration-prompt.md" />
    </div>
  )
}
