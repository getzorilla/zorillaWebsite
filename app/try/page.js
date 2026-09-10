export const metadata = { title: 'The editor · Zorilla' }

export default function Try() {
  return (
    <main>
      <iframe
        src="/editor/index.html"
        title="Zorilla editor"
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
