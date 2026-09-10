import { ed25519 } from '@noble/curves/ed25519.js'
import bs58 from 'bs58'
import { takeNonce, createSession } from '@/lib/session'
import { findProfileBy } from '@/lib/store'

// Phantom and the other Solana wallets sign plain text rather than an Ethereum
// message, so the check is a straight ed25519 verification against the address
// itself. The address is the public key, which is why nothing else is needed.
export async function POST(request) {
  const { address, message, signature } = await request.json().catch(() => ({}))
  if (!address || !message || !signature) {
    return Response.json({ error: 'Nothing to check.' }, { status: 400 })
  }

  // Single use, taken whether or not the signature turns out to be good, so a
  // captured signature cannot be replayed.
  const nonce = await takeNonce()
  if (!nonce) return Response.json({ error: 'That sign-in took too long. Try again.' }, { status: 400 })

  const host = new URL(request.url).host
  if (!message.includes(nonce)) {
    return Response.json({ error: 'That message was signed for a different sign-in.' }, { status: 401 })
  }
  if (!message.includes(host)) {
    return Response.json({ error: 'That message was signed for a different site.' }, { status: 401 })
  }

  let ok = false
  try {
    ok = ed25519.verify(bs58.decode(signature), new TextEncoder().encode(message), bs58.decode(address))
  } catch {
    ok = false
  }
  if (!ok) return Response.json({ error: 'That signature did not check out.' }, { status: 401 })

  const wallet = String(address)
  const profile = await findProfileBy('wallet', wallet)
  await createSession({ sub: `solana:${wallet}`, method: 'phantom', wallet, handle: profile?.handle ?? null })
  return Response.json({ ok: true, handle: profile?.handle ?? null })
}
