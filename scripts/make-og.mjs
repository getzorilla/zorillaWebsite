// The social card, drawn rather than pasted together, so the integration count
// and the command can never drift from what the site actually ships. Renders
// the template below at 1200x630 and writes public/og.png.
//
//   node scripts/make-og.mjs
//
// Needs Chrome and a canvas picture at public/og-canvas.png, shot at 570x340
// or any multiple of it.
//
// The file is written at 2x (2400x1260) for retina. og:image:width/height in
// app/layout.js must state those real numbers, not the 1200x630 logical size,
// or a crawler that checks them against the file sees a mismatch.
//
// X caches a card image by URL and will not refetch it when the bytes change,
// and the validator that used to force a refresh is gone. So after regenerating
// this, copy it to the next number up (og-3.png) and point app/layout.js at it,
// or the old picture keeps showing on every new post.

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const catalog = JSON.parse(await readFile(path.join(here, '../public/catalog.json'), 'utf8'))
const logo = await readFile(path.join(here, '../public/logo.svg'), 'utf8')
let shot = ''
try {
  shot = `data:image/png;base64,${(await readFile(path.join(here, '../public/og-canvas.png'))).toString('base64')}`
} catch { /* the card still reads without it */ }

export const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=Geist+Mono:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: radial-gradient(1100px 700px at 78% 6%, #1b2337 0%, #0c0f16 55%, #080a0f 100%);
    color: #f3f5f9; font-family: Geist, system-ui, sans-serif;
  }
  .mark { position: absolute; top: 52px; left: 56px; display: flex; align-items: center; gap: 16px; }
  .mark .badge {
    width: 58px; height: 58px; border-radius: 15px; background: #10131b;
    border: 1px solid #262c3b; display: grid; place-items: center;
  }
  .mark svg { width: 34px; height: 34px; }
  .mark span { font-size: 27px; font-weight: 600; letter-spacing: -.02em; }
  h1 {
    position: absolute; top: 212px; left: 56px; width: 470px;
    font-size: 55px; line-height: 1.05; font-weight: 700; letter-spacing: -.035em;
  }
  p.sub {
    position: absolute; top: 396px; left: 56px; width: 450px;
    font-size: 21px; line-height: 1.45; color: #99a3b8; letter-spacing: -.01em;
  }
  .cmd {
    position: absolute; left: 56px; bottom: 58px; display: flex; align-items: center; gap: 18px;
  }
  .cmd code {
    font-family: 'Geist Mono', ui-monospace, monospace; font-size: 21px; color: #e6eaf2;
    background: #11141c; border: 1px solid #272e3e; border-radius: 11px; padding: 13px 20px;
  }
  .cmd .site { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 21px; color: #6d788e; }
  /* the picture is inset from the right edge and stops well above the command,
     which is what it was overlapping before */
  .shot {
    position: absolute; right: 50px; top: 156px; width: 570px; height: 340px;
    border: 1px solid #262d3d; border-radius: 16px; overflow: hidden;
    background: #0b0e14; box-shadow: 0 40px 90px -30px rgba(0,0,0,.85);
  }
  /* the picture is shot at this exact ratio, so nothing is cropped away */
  .shot img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
</style></head>
<body>
  <div class="mark"><div class="badge">${logo}</div><span>Zorilla</span></div>
  <h1>Automations that run on your machine</h1>
  <p class="sub">Local, source-available, reads Ethereum (Solidity). ${catalog.integrations.length} integrations built in.</p>
  ${shot ? `<div class="shot"><img src="${shot}" alt=""></div>` : ''}
  <div class="cmd"><code>npx github:getzorilla/zorillaApp</code><span class="site">zorilla.io</span></div>
</body></html>`

await writeFile(path.join(here, '../.og.html'), html)
console.log(`wrote .og.html — ${catalog.integrations.length} integrations`)
