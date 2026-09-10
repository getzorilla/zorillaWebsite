import Link from 'next/link'
import catalog from '@/public/catalog.json'
import IntegrationGrid from '@/components/IntegrationGrid'
import IntegrationPrompt from '@/components/IntegrationPrompt'
import PromptCta from '@/components/PromptCta'
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

      <PromptCta text={prompt} filename="zorilla-integration-prompt.md" />

      <IntegrationGrid integrations={catalog.integrations} steps={steps} />

      <div id="prompt" style={{ marginTop: 34, scrollMarginTop: 80 }}>
        <IntegrationPrompt prompt={prompt} />
      </div>

      <div className="row wrap" style={{ marginTop: 20 }}>
        <Link href="/docs#integrations" className="btn quiet">The file format, if you would rather write it</Link>
      </div>
    </main>
  )
}
