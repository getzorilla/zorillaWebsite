'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const LINKS = [
  ['/docs', 'Docs'],
  ['/integrations', 'Integrations'],
  ['/marketplace', 'Marketplace'],
  ['/devlog', 'Devlog'],
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  // a panel that stays open behind you when you arrive somewhere else is a bug
  // people report as "the menu is stuck"
  useEffect(() => {
    const shut = () => setOpen(false)
    window.addEventListener('hashchange', shut)
    window.addEventListener('popstate', shut)
    return () => {
      window.removeEventListener('hashchange', shut)
      window.removeEventListener('popstate', shut)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        className="nav-burger"
        aria-label={open ? 'Close the menu' : 'Open the menu'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className={open ? 'bars on' : 'bars'} aria-hidden="true"><i /><i /><i /></span>
      </button>

      {open && (
        <div className="nav-sheet" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <nav className="nav-sheet-panel">
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
            ))}
            <a
              href="https://github.com/getzorilla/zorillaApp"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              Source
            </a>
          </nav>
        </div>
      )}
    </>
  )
}
