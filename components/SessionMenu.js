'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SessionMenu({ user }) {
  const router = useRouter()

  if (!user) return <Link href="/signin" className="btn">Sign in</Link>

  if (!user.handle) {
    return <Link href="/welcome" className="btn primary">Pick a handle</Link>
  }

  return (
    <span className="row" style={{ gap: 8 }}>
      <Link href={`/u/${user.handle}`} className="row" style={{ gap: 7 }}>
        <span className="avatar small">{user.handle[0].toUpperCase()}</span>
        <span style={{ fontSize: 13 }}>{user.handle}</span>
      </Link>
      <button
        className="btn quiet"
        onClick={async () => {
          await fetch('/api/auth/signout', { method: 'POST' })
          router.refresh()
        }}
      >
        sign out
      </button>
    </span>
  )
}
