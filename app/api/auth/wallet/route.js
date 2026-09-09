import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { parseSiweMessage } from 'viem/siwe'
import { takeNonce, createSession } from '@/lib/session'
import { findProfileBy } from '@/lib/store'

const client = createPublicClient({ chain: mainnet, transport: http() })

export async function POST(request) {
  const { message, signature } = await request.json().catch(() => ({}))
  if (!message || !signature) return Response.json({ error: 'Nothing to check.' }, { status: 400 })

  // Single use: the nonce is removed whether or not the signature turns out to
  // be good, so a captured signature cannot be replayed.
  const nonce = await takeNonce()
  if (!nonce) return Response.json({ error: 'That sign-in took too long. Try again.' }, { status: 400 })

  const host = new URL(request.url).host
  let ok = false
  try {
    ok = await client.verifySiweMessage({ message, signature, nonce, domain: host })
  } catch {
    ok = false
  }
  if (!ok) return Response.json({ error: 'That signature did not check out.' }, { status: 401 })

  const { address } = parseSiweMessage(message)
  const wallet = address.toLowerCase()
  const profile = await findProfileBy('wallet', wallet)
  await createSession({ sub: `wallet:${wallet}`, method: 'wallet', wallet, handle: profile?.handle ?? null })
  return Response.json({ ok: true, handle: profile?.handle ?? null })
}
