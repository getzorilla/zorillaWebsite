import { countInstall, getListing } from '@/lib/store'

export async function POST(request, { params }) {
  const { slug } = await params
  const listing = await getListing(slug)
  if (!listing) return Response.json({ error: 'No such listing.' }, { status: 404 })
  const installs = await countInstall(slug)
  return Response.json({ installs, package: listing.package })
}
