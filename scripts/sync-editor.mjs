// Copies the real editor out of the app repo so the demo on the website is the
// same page, not a rebuilt lookalike. Only the asset paths change, plus the
// mock API that stands in for the engine.
import { readFile, writeFile, mkdir, readdir, cp } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = process.env.ZORILLA_APP ?? path.join(here, '../../zorillaApp')
const from = path.join(app, 'public')
const to = path.join(here, '../public/editor')

await mkdir(to, { recursive: true })
const entries = (await readdir(from, { withFileTypes: true })).filter((e) => e.name !== 'mock-api.js')

for (const entry of entries.filter((e) => e.isDirectory())) {
  await cp(path.join(from, entry.name), path.join(to, entry.name), { recursive: true })
}

const files = entries.filter((e) => e.isFile()).map((e) => e.name)
for (const file of files) {
  let body = await readFile(path.join(from, file), 'utf8')
  if (file.endsWith('.js')) body = body.replaceAll("`/logos/", "`/editor/logos/")
  if (file === 'index.html') {
    body = body
      .replaceAll('href="/', 'href="/editor/')
      .replaceAll('src="/', 'src="/editor/')
      .replace('<title>zorilla</title>', '<title>zorilla — demo editor</title>')
      .replace('<script type="module" src="/editor/app.js"></script>',
        '<script src="/editor/mock-api.js"></script>\n  <script type="module" src="/editor/app.js"></script>')
  }
  await writeFile(path.join(to, file), body)
}
console.log(`editor: ${files.length} files and ${entries.length - files.length} folders copied from ${path.relative(process.cwd(), from)}`)
