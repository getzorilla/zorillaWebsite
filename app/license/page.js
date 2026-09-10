import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const metadata = { title: 'License · Zorilla' }

export default async function License() {
  const text = await readFile(path.join(process.cwd(), 'public', 'license.txt'), 'utf8')

  return (
    <main className="page section">
      <h2>License</h2>
      <p className="sub">
        Zorilla is under the Elastic License 2.0. You can read the source, run it, change it
        and use it at work. You cannot sell it to other people as a hosted service.
      </p>
      <pre className="license">{text}</pre>
    </main>
  )
}
