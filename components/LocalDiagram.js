// Drawn, not screenshotted: the point is where the pieces live, and a picture
// of the app would not show that.
export default function LocalDiagram() {
  return (
    <div className="diagram">
      <div className="machine">
        <span className="machine-tag">Your computer</span>
        <div className="machine-grid">
          <div className="chip"><b>Editor</b><span>127.0.0.1:5177</span></div>
          <div className="chip"><b>Engine</b><span>runs every step</span></div>
          <div className="chip"><b>Vault</b><span>keys, encrypted</span></div>
          <div className="chip"><b>Files</b><span>automations, run history</span></div>
        </div>
      </div>

      <div className="out">
        <span className="out-line" />
        <span className="out-label">only what a step calls</span>
      </div>

      <div className="far">
        <div className="far-row">Discord</div>
        <div className="far-row">Resend</div>
        <div className="far-row">An Ethereum endpoint</div>
      </div>
    </div>
  )
}
