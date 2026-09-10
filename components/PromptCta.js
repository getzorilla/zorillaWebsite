'use client'

import { useState } from 'react'

// The prompt itself is long, and it belongs under the grid where somebody can
// read it. What has to be at the top is the two things anybody actually wants
// from it: take a copy, or go and read it.
export default function PromptCta({ text, filename }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="prompt-cta">
      <div className="grow">
        <b>Not here? Build it.</b>
        <span> Copy this prompt, name the service, paste back what your agent writes. No code.</span>
      </div>
      <div className="row" style={{ gap: 8, flex: 'none' }}>
        <button className="btn primary" onClick={copy}>{copied ? 'Copied' : 'Copy prompt'}</button>
        <button className="btn quiet" onClick={download}>Download</button>
        <a className="btn quiet" href="#prompt">Read it</a>
      </div>
    </div>
  )
}
