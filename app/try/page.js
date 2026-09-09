export const metadata = { title: 'try the editor · zorilla' }

export default function Try() {
  return (
    <main>
      <iframe
        src="/editor/index.html"
        title="zorilla editor"
        style={{
          width: '100%',
          height: 'calc(100vh - 52px)',
          minHeight: 520,
          border: 0,
          display: 'block',
        }}
      />
    </main>
  )
}
