import Link from 'next/link'
import catalog from '@/public/catalog.json'
import IntegrationGrid from '@/components/IntegrationGrid'

export const metadata = { title: 'integrations · zorilla' }

export default function Integrations() {
  const steps = catalog.nodes.filter((n) => n.integration)

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>integrations</h2>
      <p className="sub" style={{ maxWidth: '68ch' }}>
        {catalog.integrations.length} services, {steps.length} things they can do, all of it
        shipped with the app. Each one is a file describing what a service needs and what its
        steps send, so you can read what it contacts before you use it, and writing your own
        takes no code.
      </p>

      <IntegrationGrid integrations={catalog.integrations} steps={steps} />

      <div className="row wrap" style={{ marginTop: 26 }}>
        <Link href="/docs#integrations" className="btn primary">write your own</Link>
        <Link href="/docs#steps" className="btn quiet">the rest of the steps</Link>
      </div>
    </main>
  )
}
