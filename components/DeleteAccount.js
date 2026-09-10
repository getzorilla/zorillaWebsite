'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteAccount({ handle }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setProblem('')
    setBusy(true)
    const result = await fetch('/api/profile', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: typed.trim() }),
    }).then((r) => r.json()).catch(() => ({ error: 'That did not go through.' }))
    setBusy(false)

    if (result.error) return setProblem(result.error)
    router.push('/')
    router.refresh()
  }

  if (!open) {
    return (
      <div className="danger">
        <h3>Delete account</h3>
        <p>
          Your profile, everything you published and every like you left are removed. This
          cannot be undone.
        </p>
        <button className="btn danger-btn" onClick={() => setOpen(true)}>Delete account</button>
      </div>
    )
  }

  return (
    <div className="danger">
      <h3>Delete account</h3>
      <p>Type <b>{handle}</b> to confirm.</p>
      <div className="row" style={{ maxWidth: 340 }}>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={handle} spellCheck={false} />
        <button className="btn danger-btn" onClick={remove} disabled={busy}>
          {busy ? 'deleting…' : 'Delete'}
        </button>
        <button className="btn quiet" onClick={() => { setOpen(false); setTyped(''); setProblem('') }}>Cancel</button>
      </div>
      {problem && <p style={{ color: 'var(--bad)', fontSize: 13, margin: '10px 0 0' }}>{problem}</p>}
    </div>
  )
}
