'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileForm({ profile, claiming }) {
  const router = useRouter()
  const [form, setForm] = useState({
    handle: profile?.handle ?? '',
    name: profile?.name ?? '',
    bio: profile?.bio ?? '',
    x: profile?.links?.x ?? '',
    github: profile?.links?.github ?? '',
    site: profile?.links?.site ?? '',
  })
  const [problem, setProblem] = useState('')
  const [saved, setSaved] = useState(false)

  const set = (key) => (event) => { setForm({ ...form, [key]: event.target.value }); setSaved(false) }

  const submit = async () => {
    setProblem('')
    const result = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        handle: form.handle,
        name: form.name,
        bio: form.bio,
        links: { x: form.x, github: form.github, site: form.site },
      }),
    }).then((r) => r.json())

    if (result.error) return setProblem(result.error)
    setSaved(true)
    router.refresh()
    if (claiming) router.push(`/u/${result.handle}`)
  }

  return (
    <div style={{ maxWidth: 460 }}>
      {claiming && (
        <div className="field">
          <label>Handle</label>
          <input value={form.handle} onChange={set('handle')} placeholder="aykk" spellCheck={false} />
          <div className="help">Your address on the marketplace: zorilla.io/u/handle. This cannot be changed later.</div>
        </div>
      )}
      <div className="field">
        <label>Display name</label>
        <input value={form.name} onChange={set('name')} placeholder="Optional" />
      </div>
      <div className="field">
        <label>Bio</label>
        <textarea rows={3} value={form.bio} onChange={set('bio')} placeholder="Optional" />
      </div>
      <div className="field">
        <label>x</label>
        <input value={form.x} onChange={set('x')} placeholder="4aykk" spellCheck={false} />
      </div>
      <div className="field">
        <label>GitHub</label>
        <input value={form.github} onChange={set('github')} placeholder="aykk" spellCheck={false} />
      </div>
      <div className="field">
        <label>Website</label>
        <input value={form.site} onChange={set('site')} placeholder="https://" spellCheck={false} />
      </div>
      <div className="row">
        <button className="btn primary" onClick={submit}>{claiming ? 'claim it' : 'save'}</button>
        {saved && <span className="dim" style={{ fontSize: 13 }}>saved</span>}
      </div>
      {problem && <p style={{ color: 'var(--bad)', fontSize: 13 }}>{problem}</p>}
    </div>
  )
}
