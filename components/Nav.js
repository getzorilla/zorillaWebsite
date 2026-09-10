import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import SessionMenu from './SessionMenu'
import { GithubMark } from './Icons'
import MobileNav from './MobileNav'

export default async function Nav() {
  const user = await currentUser()
  return (
    <nav className="nav">
      <div className="page nav-inner">
        <Link href="/" className="brand">
          <img src="/logo.svg" alt="" width="22" height="22" />
          <span>Zorilla</span>
        </Link>
        <span className="nav-links">
          <Link href="/docs" className="link">Docs</Link>
          <Link href="/integrations" className="link">Integrations</Link>
          <Link href="/marketplace" className="link">Marketplace</Link>
          <Link href="/devlog" className="link">Devlog</Link>
        </span>
        <span className="nav-end">
          <a
            className="link icon-link"
            href="https://github.com/getzorilla/zorillaApp"
            target="_blank"
            rel="noreferrer"
            aria-label="Zorilla on GitHub"
            title="GitHub"
          >
            <GithubMark size={16} />
          </a>
          <SessionMenu user={user ? { handle: user.handle, avatar: user.profile?.avatar ?? null } : null} />
          <MobileNav />
        </span>
      </div>
    </nav>
  )
}
