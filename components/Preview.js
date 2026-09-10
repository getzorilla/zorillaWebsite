'use client'

import { useState } from 'react'

// Anything long enough to scroll gets the same two buttons in the same corner:
// take it, or keep it.
export default function Preview({ title, text, filename, children }) {
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
    <div className="preview-box">
      <div className="preview-bar">
        {title && <span className="preview-title">{title}</span>}
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
        <button className="icon-btn" onClick={download} title={`download ${filename}`} aria-label="download">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M12 4v11" />
            <path d="m7.5 11 4.5 4.5 4.5-4.5" />
            <path d="M5 19h14" />
          </svg>
        </button>
      </div>
      {children ?? <pre className="preview-text">{text}</pre>}
    </div>
  )
}
