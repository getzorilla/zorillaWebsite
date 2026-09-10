import catalog from '@/public/catalog.json'

const LOGOS = new Set([
  'airtable', 'anthropic', 'coingecko', 'deepseek', 'discord', 'etherscan', 'gemini',
  'gmail', 'notion', 'openai', 'resend', 'slack', 'stripe', 'supabase', 'telegram',
  'twilio', 'web3',
])

const CORE = new Set(['core', 'logic', 'flow', 'transform', 'output', 'net', 'code', 'file'])
const serviceOf = (def) => {
  if (def.integration) return def.integration
  const prefix = String(def.type).split('.')[0]
  return CORE.has(prefix) ? null : prefix
}

const GROUP_LABEL = {
  trigger: 'Starting a run',
  logic: 'Choosing and remembering',
  transform: 'Changing items',
  action: 'Doing something',
  output: 'Finishing',
  web3: 'Chains',
}

function Params({ params }) {
  if (!params?.length) return <p style={{ fontSize: 12.5 }}>Takes nothing.</p>
  return (
    <table className="ref">
      <tbody>
        {params.map((p) => {
          const type = p.credentialType
            ? `a saved ${p.credentialType} key`
            : p.options?.length
              ? p.options.map((o) => o.value ?? o).join(' | ')
              : p.type
          const fallback = p.default !== undefined && p.default !== '' && !Array.isArray(p.default)
            ? `Defaults to ${JSON.stringify(p.default)}.`
            : ''
          return (
            <tr key={p.key}>
              <td>{p.key}</td>
              <td className="type">{type}</td>
              <td>{p.description || p.label}{p.description && fallback ? ` ${fallback}` : ''}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Step({ def }) {
  const service = serviceOf(def)
  return (
    <div className="ref-step" id={def.type}>
      <div className="head">
        {service && LOGOS.has(service) && <img src={`/editor/logos/${service}.svg`} alt="" />}
        <code>{def.type}</code>
        <span className="kind">{def.poll ? 'waits' : def.category}</span>
      </div>
      <p>{def.description || def.label}</p>
      {def.outputs?.length > 1 && (
        <p style={{ fontSize: 12.5 }}>Sends items out of: {def.outputs.map((o) => <code key={o} style={{ marginRight: 6 }}>{o}</code>)}</p>
      )}
      <Params params={def.params} />
    </div>
  )
}

export default function StepReference() {
  const services = new Map()
  const core = new Map()

  for (const def of catalog.nodes) {
    const service = serviceOf(def)
    const bucket = service ? services : core
    const key = service ?? def.category
    if (!bucket.has(key)) bucket.set(key, [])
    bucket.get(key).push(def)
  }

  const sorted = (m) => [...m].sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <>
      <h3 id="steps-built-in">Built in</h3>
      {sorted(core).map(([category, defs]) => (
        <div key={category}>
          <h4>{GROUP_LABEL[category] ?? category}</h4>
          {defs.sort((a, b) => a.type.localeCompare(b.type)).map((def) => <Step key={def.type} def={def} />)}
        </div>
      ))}

      <h3 id="steps-services">Services</h3>
      {sorted(services).map(([id, defs]) => {
        const spec = catalog.integrations.find((i) => i.id === id)
        return (
          <div key={id}>
            <h4>{spec?.label ?? id}</h4>
            {spec && <p style={{ fontSize: 12.5 }}>{spec.description} Contacts {spec.hosts.join(', ') || 'nothing'}.</p>}
            {defs.sort((a, b) => a.type.localeCompare(b.type)).map((def) => <Step key={def.type} def={def} />)}
          </div>
        )
      })}
    </>
  )
}
