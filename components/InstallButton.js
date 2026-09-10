'use client'

import { useState } from 'react'

export default function InstallButton({ slug, title, kind }) {
  const [count, setCount] = useState(null)

  const download = async () => {
    const result = await fetch(`/api/listings/${slug}/install`, { method: 'POST' }).then((r) => r.json())
    if (result.error) return
    setCount(result.installs)
    const blob = new Blob([JSON.stringify(result.package, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${slug}.${kind === 'integration' ? 'integration' : 'automation'}.json`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <span className="row">
      <button className="btn primary" onClick={download}>Download the file</button>
      {count !== null && <span className="dim" style={{ fontSize: 13 }}>{count} installs</span>}
    </span>
  )
}
