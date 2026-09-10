'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PostBody from './PostBody'

const MAX_SIDE = 1600

// Shrunk in the browser, because a post carries its pictures with it and a
// screenshot straight off a retina display is several megabytes.
async function shrink(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.82)
}

const dayOf = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))

export default function DevlogEditor({ post = null }) {
  const router = useRouter()
  const file = useRef(null)
  const bodyRef = useRef(null)
  const [form, setForm] = useState({
    title: post?.title ?? '',
    summary: post?.summary ?? '',
    body: post?.body ?? '',
    publishedAt: dayOf(post?.publishedAt),
    draft: post?.draft ?? false,
  })
  const [images, setImages] = useState(post?.images ?? [])
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm({ ...form, [key]: value })
  }

  const pick = async (event) => {
    const chosen = [...(event.target.files ?? [])]
    event.target.value = ''
    setProblem('')
    try {
      const added = []
      for (const one of chosen.slice(0, 8 - images.length)) {
        added.push({ id: `img${Date.now()}${added.length}`, src: await shrink(one), alt: '' })
      }
      setImages([...images, ...added])
    } catch {
      setProblem('One of those could not be read as a picture.')
    }
  }

  // put the picture where the cursor is, as its id, so moving text around moves
  // the picture with it
  const insert = (image) => {
    const box = bodyRef.current
    const mark = `\n![](${image.id})\n`
    const at = box?.selectionStart ?? form.body.length
    setForm({ ...form, body: form.body.slice(0, at) + mark + form.body.slice(at) })
    box?.focus()
  }

  const submit = async () => {
    setProblem('')
    setBusy(true)
    const result = await fetch('/api/devlog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, images, was: post?.slug ?? '' }),
    }).then((r) => r.json()).catch(() => ({ error: 'That did not save.' }))
    setBusy(false)
    if (result.error) return setProblem(result.error)
    router.push(`/devlog/${result.slug}`)
    router.refresh()
  }

  const remove = async () => {
    if (!post) return
    setBusy(true)
    await fetch('/api/devlog', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: post.slug }),
    })
    setBusy(false)
    router.push('/devlog')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="field">
        <label>Title</label>
        <input value={form.title} onChange={set('title')} placeholder="What happened" />
      </div>

      <div className="row" style={{ gap: 14, alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Date</label>
          <input type="date" value={form.publishedAt} onChange={set('publishedAt')} />
        </div>
        <div className="field">
          <label className="row" style={{ gap: 7 }}>
            <input
              type="checkbox"
              checked={form.draft}
              onChange={set('draft')}
              style={{ width: 'auto', boxShadow: 'none' }}
            />
            <span>Draft</span>
          </label>
        </div>
      </div>

      <div className="field">
        <label>Summary</label>
        <input value={form.summary} onChange={set('summary')} placeholder="One line, shown in the list" />
      </div>

      <div className="field">
        <label>Body</label>
        <textarea
          ref={bodyRef}
          rows={16}
          value={form.body}
          onChange={set('body')}
          placeholder={'Markdown. # heading, - list, **bold**, `code`, [text](link).'}
        />
        <div className="help">Markdown: # heading, - list, &gt; quote, ``` code, **bold**, `code`, [text](link).</div>
      </div>

      <div className="field">
        <label>Pictures</label>
        <input ref={file} type="file" accept="image/*" multiple onChange={pick} hidden />
        <div className="row wrap">
          <button className="btn" onClick={() => file.current?.click()}>Add</button>
          {images.length > 0 && <span className="dim" style={{ fontSize: 12.5 }}>{images.length} of 8</span>}
        </div>
        {images.length > 0 && (
          <div className="post-thumbs">
            {images.map((image) => (
              <div key={image.id} className="post-thumb">
                <img src={image.src} alt="" />
                <div className="row" style={{ gap: 4 }}>
                  <button className="btn" onClick={() => insert(image)}>Insert</button>
                  <button className="btn quiet" onClick={() => setImages(images.filter((i) => i.id !== image.id))}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="row wrap" style={{ marginTop: 6 }}>
        <button className="btn primary" onClick={submit} disabled={busy}>
          {busy ? 'Saving' : post ? 'Save' : 'Post'}
        </button>
        <button className="btn quiet" onClick={() => setPreview(!preview)}>
          {preview ? 'Hide preview' : 'Preview'}
        </button>
        <span className="spacer" />
        {post && <button className="btn quiet" onClick={remove} disabled={busy}>Delete</button>}
      </div>
      {problem && <p style={{ color: 'var(--bad)', fontSize: 13 }}>{problem}</p>}

      {preview && (
        <div style={{ marginTop: 26, borderTop: '1px solid var(--line)', paddingTop: 22 }}>
          <h3 className="plain" style={{ margin: '0 0 4px' }}>{form.title || 'Untitled'}</h3>
          <PostBody text={form.body} images={images} />
        </div>
      )}
    </div>
  )
}
