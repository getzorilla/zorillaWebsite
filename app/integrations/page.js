import Link from 'next/link'
import catalog from '@/public/catalog.json'
import IntegrationGrid from '@/components/IntegrationGrid'
import IntegrationPrompt from '@/components/IntegrationPrompt'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const metadata = { title: 'integrations · zorilla' }

export default async function Integrations() {
  const steps = catalog.nodes.filter((n) => n.integration)
  const prompt = await readFile(path.join(process.cwd(), 'public', 'integration-prompt.md'), 'utf8')

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

      <div style={{ marginTop: 30 }}>
        <IntegrationPrompt prompt={prompt} />
      </div>

      <div className="row wrap" style={{ marginTop: 20 }}>
        <Link href="/docs#integrations" className="btn quiet">the file format, if you would rather write it</Link>
      </div>
    </main>
  )
}
