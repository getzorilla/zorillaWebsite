import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import SessionMenu from './SessionMenu'

export default async function Nav() {
  const user = await currentUser()
  return (
    <nav className="nav">
      <div className="page nav-inner">
        <Link href="/" className="brand">
          <img src="/logo.svg" alt="" width="22" height="22" />
          <span>zorilla</span>
        </Link>
        <Link href="/marketplace" className="link">marketplace</Link>
        <Link href="/marketplace/themes" className="link">themes</Link>
        <Link href="/try" className="link">try the editor</Link>
        <a className="link" href="https://github.com/aykk/zorilla" target="_blank" rel="noreferrer">github</a>
        <span className="spacer" />
        <SessionMenu user={user ? { handle: user.handle, method: user.method } : null} />
      </div>
    </nav>
  )
}
