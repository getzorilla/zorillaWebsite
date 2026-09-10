// Drawn, not screenshotted: the point is where the pieces live, and a picture
// of the app would not show that. The arrow only ever points one way, because
// that asymmetry is the whole claim.
export default function LocalDiagram() {
  return (
    <div className="diagram">
      <div className="machine">
        <span className="machine-tag">Your computer</span>
        <div className="machine-grid">
          <div className="chip"><b>Editor</b><span>127.0.0.1:5177</span></div>
          <div className="chip"><b>Engine</b><span>Runs every step</span></div>
          <div className="chip stays"><b>Vault</b><span>Keys, encrypted</span></div>
          <div className="chip stays"><b>Files</b><span>Automations, run history</span></div>
        </div>
        <p className="machine-foot">Your keys and your files never leave this box.</p>
      </div>

      <div className="out">
        <span className="out-label top">A step calls out</span>
        <span className="out-arrow" aria-hidden="true" />
        <span className="out-label bottom">Nothing calls in</span>
        <span className="out-blocked" aria-hidden="true" />
      </div>

      <div className="far">
        <span className="far-tag">Only the services a step names</span>
        <div className="far-row">Discord</div>
        <div className="far-row">Resend</div>
        <div className="far-row">An Ethereum endpoint</div>
      </div>
    </div>
  )
}
