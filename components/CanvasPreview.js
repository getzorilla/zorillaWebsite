import catalog from '@/public/catalog.json'
import { summaryOf } from '@/lib/summary'

const NODES = new Map(catalog.nodes.map((n) => [n.type, n]))
// which marks exist is decided by the app's logo folder, copied here on sync
const LOGOS = new Set(catalog.logos ?? [])
const CORE = new Set(['core', 'logic', 'flow', 'transform', 'output', 'net', 'code', 'file'])

const serviceOf = (def) => {
  if (!def) return null
  if (def.integration) return def.integration
  const prefix = String(def.type).split('.')[0]
  return CORE.has(prefix) ? null : prefix
}

const W = 210
const H = 64

// The automation drawn from the file itself, the same way the editor draws it.
// Somebody looking at a listing should see the shape of the thing before they
// decide whether to read the json.
export default function CanvasPreview({ workflow, height = 150 }) {
  const nodes = workflow?.nodes ?? []
  if (!nodes.length) return null

  const left = Math.min(...nodes.map((n) => n.position?.x ?? 0))
  const top = Math.min(...nodes.map((n) => n.position?.y ?? 0))
  const right = Math.max(...nodes.map((n) => (n.position?.x ?? 0) + W))
  const bottom = Math.max(...nodes.map((n) => (n.position?.y ?? 0) + H))
  const pad = 24
  const viewBox = `${left - pad} ${top - pad} ${right - left + pad * 2} ${bottom - top + pad * 2}`

  const at = (id) => nodes.find((n) => n.id === id)
  const wire = (from, to) => {
    const a = at(from)
    const b = at(to)
    if (!a || !b) return null
    const ax = (a.position?.x ?? 0) + W
    const ay = (a.position?.y ?? 0) + 26
    const bx = b.position?.x ?? 0
    const by = (b.position?.y ?? 0) + 26
    const bend = Math.max(40, Math.abs(bx - ax) / 2)
    return `M ${ax} ${ay} C ${ax + bend} ${ay}, ${bx - bend} ${by}, ${bx} ${by}`
  }

  return (
    <svg className="preview" viewBox={viewBox} style={{ height }} role="img" aria-label="the steps in this automation">
      {(workflow.edges ?? []).map((edge, i) => {
        const d = wire(edge.from, edge.to)
        return d ? <path key={i} d={d} fill="none" stroke="var(--dimmer)" strokeWidth="2" /> : null
      })}
      {nodes.map((node) => {
        const def = NODES.get(node.type)
        const service = serviceOf(def)
        const x = node.position?.x ?? 0
        const y = node.position?.y ?? 0
        return (
          <g key={node.id}>
            <rect x={x} y={y} width={W} height={H} rx="9" fill="var(--raise)" stroke="var(--line)" />
            {service && LOGOS.has(service) && (
              <image href={`/editor/logos/${service}.svg`} x={x + 12} y={y + 13} width="16" height="16" />
            )}
            <text
              x={x + (service && LOGOS.has(service) ? 36 : 12)}
              y={y + 26}
              fill="var(--text)"
              fontSize="13"
              fontWeight="600"
            >
              {(() => {
                const label = node.name || def?.label || node.type
                return label.length > 26 ? `${label.slice(0, 25)}…` : label
              })()}
            </text>
            <text x={x + 12} y={y + 45} fill="var(--dim)" fontSize="11">
              {(() => {
                const said = summaryOf(node, def)
                return said.length > 30 ? `${said.slice(0, 29)}…` : said
              })()}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
