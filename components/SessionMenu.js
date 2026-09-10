'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from './Avatar'

export default function SessionMenu({ user }) {
  const router = useRouter()

  if (!user) return <Link href="/signin" className="btn">Sign in</Link>

  if (!user.handle) {
    return <Link href="/welcome" className="btn primary">Finish setup</Link>
  }

  return (
    <span className="row" style={{ gap: 8 }}>
      <Link href={`/u/${user.handle}`} className="row" style={{ gap: 7 }}>
        <Avatar src={user.avatar} handle={user.handle} size={24} />
        <span style={{ fontSize: 13 }}>{user.handle}</span>
      </Link>
      <button
        className="btn quiet"
        onClick={async () => {
          await fetch('/api/auth/signout', { method: 'POST' })
          router.refresh()
        }}
      >
        Sign out
      </button>
    </span>
  )
}
