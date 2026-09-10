import { tooMany } from '@/lib/limit'
import { generateSiweNonce } from 'viem/siwe'
import { issueNonce } from '@/lib/session'

export async function GET(request) {
  const slowDown = tooMany(request, { name: 'nonce', limit: 40, windowMs: 60 * 1000 })
  if (slowDown) return slowDown

  const nonce = generateSiweNonce()
  await issueNonce(nonce)
  return Response.json({ nonce })
}
