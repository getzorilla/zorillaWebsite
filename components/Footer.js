import { GithubMark, XMark } from './Icons'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="page row wrap">
        <span className="dimmer mono">zorilla, MIT</span>
        <span className="spacer" />
        <a href="/marketplace">marketplace</a>
        <a
          className="icon-link"
          href="https://github.com/zorilla-automate/zorillaApp"
          target="_blank"
          rel="noreferrer"
          aria-label="zorilla on GitHub"
          title="GitHub"
        >
          <GithubMark size={16} />
        </a>
        <a
          className="icon-link"
          href="https://x.com/4aykk"
          target="_blank"
          rel="noreferrer"
          aria-label="zorilla on X"
          title="X"
        >
          <XMark size={14} />
        </a>
      </div>
    </footer>
  )
}
