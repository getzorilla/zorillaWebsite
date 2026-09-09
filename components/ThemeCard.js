// The swatch is the app's own furniture in miniature: a bar, a step, a second
// step. Enough to tell two dark themes apart before installing one.
export function ThemePreview({ colors }) {
  return (
    <div className="theme-preview" style={{ background: colors.bg }}>
      <div className="strip">
        <span className="dot" style={{ background: colors.accent }} />
        <span className="plank" style={{ background: colors.line }} />
        <span className="dot" style={{ background: colors.ok }} />
      </div>
      <div className="node" style={{ background: colors.raise, borderColor: colors.line }}>
        <span className="dot" style={{ background: colors.accent, width: 7, height: 7 }} />
        <em style={{ background: colors.text, opacity: 0.7 }} />
      </div>
      <div className="node" style={{ background: colors.raise, borderColor: colors.line, marginLeft: 26 }}>
        <span className="dot" style={{ background: colors.warn, width: 7, height: 7 }} />
        <em style={{ background: colors.dim }} />
      </div>
    </div>
  )
}

export default function ThemeCard({ theme, href }) {
  return (
    <div className="theme-card">
      <ThemePreview colors={theme.colors} />
      <div className="theme-foot">
        <strong>{theme.label}</strong>
        <span>{theme.appearance}</span>
      </div>
      <div className="theme-actions">
        <a className="btn" href={href ?? `/api/themes/${theme.id}`} download={`${theme.id}.theme.json`}>download</a>
        {theme.author && <span className="dim" style={{ fontSize: 12, alignSelf: 'center' }}>{theme.author}</span>}
      </div>
    </div>
  )
}
