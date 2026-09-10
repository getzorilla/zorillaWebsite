import { GithubMark, XMark } from './Icons'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="page row wrap">
        <a className="dimmer mono" href="https://github.com/getzorilla/zorillaApp/blob/main/LICENSE" target="_blank" rel="noreferrer">Zorilla, Elastic License 2.0</a>
        <span className="spacer" />
        <a href="/marketplace">Marketplace</a>
        <a
          className="icon-link"
          href="https://github.com/getzorilla/zorillaApp"
          target="_blank"
          rel="noreferrer"
          aria-label="Zorilla on GitHub"
          title="GitHub"
        >
          <GithubMark size={16} />
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
