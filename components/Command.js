'use client'

import { useState } from 'react'

// A line somebody has to type into a terminal, with the one button that saves
// them typing it.
export default function Command({ children }) {
  const [copied, setCopied] = useState(false)
  const text = String(children).trim()

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="command">
      <pre><code>{text}</code></pre>
      <button className="icon-btn" onClick={copy} title={copied ? 'copied' : 'copy'} aria-label="copy">
        {copied ? (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </button>
    </div>
  )
}
