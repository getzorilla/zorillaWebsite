import catalog from '@/public/catalog.json'

// The file people download is the file the app reads. No wrapper, no installer.
export async function GET(request, { params }) {
  const { id } = await params
  const theme = (catalog.themes ?? []).find((t) => t.id === id)
  if (!theme) return Response.json({ error: 'No such theme.' }, { status: 404 })

  return new Response(JSON.stringify(theme, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${theme.id}.theme.json"`,
    },
  })
}
