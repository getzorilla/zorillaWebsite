import Link from 'next/link'
import { NpmMark, XMark } from './Icons'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="page row wrap">
        <Link className="dimmer mono" href="/license">Zorilla, Elastic License 2.0</Link>
        <span className="spacer" />
        <a href="/marketplace">Marketplace</a>
        <a
          className="icon-link"
          href="https://www.npmjs.com/package/zorilla"
          target="_blank"
          rel="noreferrer"
          aria-label="Zorilla on npm"
          title="npm"
        >
          <NpmMark size={28} />
        </a>
        <a
          className="icon-link"
          href="https://x.com/4aykk"
          target="_blank"
          rel="noreferrer"
          aria-label="Zorilla on X"
          title="X"
        >
          <XMark size={14} />
        </a>
      </div>
    </footer>
  )
}
