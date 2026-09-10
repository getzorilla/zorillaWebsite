'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from './Avatar'

const MAX_SIDE = 256

// Squared and shrunk in the browser, so what reaches the server is a small
// picture rather than whatever came off somebody's phone.
async function toSquare(file) {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const out = Math.min(side, MAX_SIDE)
  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = out
  canvas.getContext('2d').drawImage(
    bitmap,
    (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side,
    0, 0, out, out,
  )
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.82)
}

export default function ProfileForm({ profile, claiming }) {
  const router = useRouter()
  const file = useRef(null)
  const [form, setForm] = useState({
    handle: profile?.handle ?? '',
    name: profile?.name ?? '',
    bio: profile?.bio ?? '',
    x: profile?.links?.x ?? '',
    github: profile?.links?.github ?? '',
    site: profile?.links?.site ?? '',
  })
  const [avatar, setAvatar] = useState(profile?.avatar ?? null)
  const [problem, setProblem] = useState('')
  const [saved, setSaved] = useState(false)

  const set = (key) => (event) => { setForm({ ...form, [key]: event.target.value }); setSaved(false) }

  const pick = async (event) => {
    const chosen = event.target.files?.[0]
    if (!chosen) return
    setProblem('')
    try {
      setAvatar(await toSquare(chosen))
      setSaved(false)
    } catch {
      setProblem('That file could not be read as a picture.')
    }
    event.target.value = ''
  }

  const submit = async () => {
    setProblem('')
    const result = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        handle: form.handle,
        name: form.name,
        bio: form.bio,
        avatar,
        links: { x: form.x, github: form.github, site: form.site },
      }),
    }).then((r) => r.json())

    if (result.error) return setProblem(result.error)
    setSaved(true)
    if (claiming) router.push(`/u/${result.handle}`)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 460 }}>
      <div className="field">
        <label>Username</label>
        <div className="row">
          <input
            value={form.handle}
            onChange={set('handle')}
            placeholder="yourname"
            spellCheck={false}
            autoCapitalize="none"
          />
          {!claiming && <button className="btn" onClick={submit}>Save</button>}
        </div>
        <div className="help">
          Lowercase letters, numbers, dashes and underscores. Your page is
          zorilla.io/u/{form.handle || 'username'}.
        </div>
      </div>

      <div className="field">
        <label>Display name</label>
        <input value={form.name} onChange={set('name')} placeholder="Optional" />
      </div>

      <div className="field">
        <label>Picture</label>
        <div className="row" style={{ gap: 14 }}>
          <Avatar src={avatar} handle={form.handle} size={56} />
          <input ref={file} type="file" accept="image/*" onChange={pick} hidden />
          <button className="btn" onClick={() => file.current?.click()}>
            {avatar ? 'Change' : 'Upload'}
          </button>
          {avatar && <button className="btn quiet" onClick={() => { setAvatar(null); setSaved(false) }}>Remove</button>}
        </div>
        <div className="help">Optional. Squared and shrunk before it is saved.</div>
      </div>

      <div className="field">
        <label>Bio</label>
        <textarea rows={3} value={form.bio} onChange={set('bio')} placeholder="Optional" />
      </div>
      <div className="field">
        <label>X</label>
        <input value={form.x} onChange={set('x')} placeholder="username or link" spellCheck={false} />
      </div>
      <div className="field">
        <label>GitHub</label>
        <input value={form.github} onChange={set('github')} placeholder="username or link" spellCheck={false} />
      </div>
      <div className="field">
        <label>Website</label>
        <input value={form.site} onChange={set('site')} placeholder="https://" spellCheck={false} />
      </div>
      <div className="row">
        <button className="btn primary" onClick={submit}>{claiming ? 'Create account' : 'Save'}</button>
        {saved && <span className="dim" style={{ fontSize: 13 }}>saved</span>}
      </div>
      {problem && <p style={{ color: 'var(--bad)', fontSize: 13 }}>{problem}</p>}
    </div>
  )
}
