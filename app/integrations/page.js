import Link from 'next/link'
import catalog from '@/public/catalog.json'
import IntegrationGrid from '@/components/IntegrationGrid'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const metadata = { title: 'Integrations · Zorilla' }

export default async function Integrations() {
  const steps = catalog.nodes.filter((n) => n.integration)
  const prompt = await readFile(path.join(process.cwd(), 'public', 'integration-prompt.md'), 'utf8')

  return (
    <main className="page section" style={{ borderTop: 0 }}>
      <h2>Integrations</h2>
      <p className="sub">
        {catalog.integrations.length} built in. Each one is a file you can read before you use
        it, and it contains no code.
      </p>

      <IntegrationGrid integrations={catalog.integrations} steps={steps} prompt={prompt} />

      <div className="row wrap" style={{ marginTop: 20 }}>
        <Link href="/docs#integrations" className="btn quiet">The file format, if you would rather write it</Link>
      </div>
    </main>
  )
}
