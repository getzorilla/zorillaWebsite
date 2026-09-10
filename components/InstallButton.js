'use client'

export default function InstallButton({ slug, kind }) {
  const download = async () => {
    const result = await fetch(`/api/listings/${slug}/install`, { method: 'POST' }).then((r) => r.json())
    if (result.error) return
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

  return <button className="btn primary" onClick={download}>Download the file</button>
}
