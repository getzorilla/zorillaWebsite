// The two files an agent is handed, copied out of the app repo so the site
// serves exactly what the app ships. Both are generated there:
//
//   cd ../zorillaApp && npm run docs
//
import { copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = process.env.ZORILLA_APP ?? path.join(here, '../../zorillaApp')

await copyFile(path.join(app, 'DOCS.md'), path.join(here, '../public/zorilla.md'))
await copyFile(path.join(app, 'docs/integration-prompt.md'), path.join(here, '../public/integration-prompt.md'))
console.log('copied DOCS.md and integration-prompt.md from the app')
