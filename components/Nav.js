import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import SessionMenu from './SessionMenu'
import { GithubMark } from './Icons'

export default async function Nav() {
  const user = await currentUser()
  return (
    <nav className="nav">
      <div className="page nav-inner">
        <Link href="/" className="brand">
          <img src="/logo.svg" alt="" width="22" height="22" />
          <span>zorilla</span>
        </Link>
        <span className="nav-links">
          <Link href="/docs" className="link">docs</Link>
          <Link href="/integrations" className="link">integrations</Link>
          <Link href="/marketplace" className="link">marketplace</Link>
          <Link href="/try" className="link">try the editor</Link>
        </span>
        <span className="nav-end">
          <a
            className="link icon-link"
            href="https://github.com/zorilla-automate/zorillaApp"
            target="_blank"
            rel="noreferrer"
            aria-label="zorilla on GitHub"
            title="GitHub"
          >
            <GithubMark size={16} />
          </a>
          <SessionMenu user={user ? { handle: user.handle, method: user.method } : null} />
        </span>
      </div>
    </nav>
  )
}
