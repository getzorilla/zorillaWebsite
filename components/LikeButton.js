'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// One row per account in the database, so the number is that many people. It
// moves the moment you press it and rolls back if the server says no.
export default function LikeButton({ slug, likes = 0, liked = false, signedIn }) {
  const router = useRouter()
  const [count, setCount] = useState(likes)
  const [on, setOn] = useState(liked)
  const [problem, setProblem] = useState('')

  const toggle = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!signedIn) return router.push('/signin')

    const next = !on
    setOn(next)
    setCount((n) => n + (next ? 1 : -1))
    const result = await fetch(`/api/listings/${slug}/like`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ liked: next }),
    }).then((r) => r.json()).catch(() => ({ error: 'That did not save.' }))

    if (result.error) {
      setOn(!next)
      setCount((n) => n + (next ? -1 : 1))
      setProblem(result.error)
      return
    }
    setCount(result.likes)
    setOn(result.liked)
  }

  return (
    <button className={`like${on ? ' on' : ''}`} onClick={toggle} title={problem || (on ? 'liked' : 'like this')}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 20s-7-4.35-7-9.5A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.9c0 5.15-7 9.5-7 9.5Z" />
      </svg>
      {count}
    </button>
  )
}
