// Markdown, rendered to elements rather than to HTML.
//
// Small on purpose: headings, lists, quotes, fenced code, pictures and the
// inline marks. Nothing here builds an HTML string, so a post can never inject
// markup, and the parser can stay this short because the only person who can
// write a post is the person who runs the site.

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

function inline(text, key = 0) {
  return String(text).split(INLINE).filter(Boolean).map((piece, i) => {
    const at = `${key}-${i}`
    if (piece.startsWith('**') && piece.endsWith('**')) return <strong key={at}>{piece.slice(2, -2)}</strong>
    if (piece.startsWith('`') && piece.endsWith('`')) return <code key={at}>{piece.slice(1, -1)}</code>
    if (piece.startsWith('*') && piece.endsWith('*')) return <em key={at}>{piece.slice(1, -1)}</em>
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(piece)
    if (link) {
      const href = link[2]
      // a post is written by the owner, but a pasted link is still only ever
      // followed, never used as a scheme somebody could smuggle something into
      const safe = /^(https?:|\/|#)/.test(href) ? href : '#'
      return (
        <a key={at} className="inline-link" href={safe} target={safe.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {link[1]}
        </a>
      )
    }
    return <span key={at}>{piece}</span>
  })
}

export default function PostBody({ text, images = [] }) {
  const byId = new Map(images.map((image) => [image.id, image]))
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let list = null
  let fence = null

  const closeList = () => {
    if (list) { blocks.push({ kind: 'list', items: list }); list = null }
  }

  for (const line of lines) {
    if (fence !== null) {
      if (line.trim().startsWith('```')) { blocks.push({ kind: 'code', text: fence.join('\n') }); fence = null }
      else fence.push(line)
      continue
    }
    if (line.trim().startsWith('```')) { closeList(); fence = []; continue }

    const picture = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line.trim())
    if (picture) {
      closeList()
      blocks.push({ kind: 'image', alt: picture[1], src: picture[2] })
      continue
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) { closeList(); blocks.push({ kind: `h${heading[1].length}`, text: heading[2] }); continue }
    if (/^>\s?/.test(line)) { closeList(); blocks.push({ kind: 'quote', text: line.replace(/^>\s?/, '') }); continue }
    if (/^[-*]\s+/.test(line)) { list = list ?? []; list.push(line.replace(/^[-*]\s+/, '')); continue }
    if (!line.trim()) { closeList(); continue }
    closeList()
    // Strict markdown folds a single newline into the previous line. Nobody
    // typing in a box expects that: pressing return should break the line.
    const last = blocks[blocks.length - 1]
    if (last?.kind === 'p') last.lines.push(line)
    else blocks.push({ kind: 'p', lines: [line] })
  }
  closeList()
  if (fence) blocks.push({ kind: 'code', text: fence.join('\n') })

  return (
    <div className="post-body">
      {blocks.map((block, i) => {
        if (block.kind === 'h1') return <h3 key={i}>{inline(block.text, i)}</h3>
        if (block.kind === 'h2') return <h4 key={i}>{inline(block.text, i)}</h4>
        if (block.kind === 'h3') return <h5 key={i}>{inline(block.text, i)}</h5>
        if (block.kind === 'quote') return <blockquote key={i}>{inline(block.text, i)}</blockquote>
        if (block.kind === 'code') return <pre key={i}><code>{block.text}</code></pre>
        if (block.kind === 'list') {
          return <ul key={i}>{block.items.map((item, j) => <li key={j}>{inline(item, `${i}-${j}`)}</li>)}</ul>
        }
        if (block.kind === 'image') {
          // a picture is written as its id, and the post carries the bytes
          const found = byId.get(block.src)
          const src = found?.src ?? (/^(https?:|\/)/.test(block.src) ? block.src : null)
          if (!src) return null
          return (
            <figure key={i}>
              <img src={src} alt={block.alt || found?.alt || ''} />
              {block.alt && <figcaption>{block.alt}</figcaption>}
            </figure>
          )
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {inline(line, `${i}-${j}`)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
