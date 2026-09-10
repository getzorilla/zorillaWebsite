'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSiweMessage } from 'viem/siwe'

// Base58 as Solana writes it. Small enough that pulling in a library for the
// browser bundle would cost more than it saves.
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
function bs58encode(bytes) {
  const digits = [0]
  for (const byte of bytes) {
    let carry = byte
    for (let i = 0; i < digits.length; i += 1) {
      carry += digits[i] << 8
      digits[i] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  let out = ''
  for (const byte of bytes) {
    if (byte === 0) out += ALPHABET[0]
    else break
  }
  for (let i = digits.length - 1; i >= 0; i -= 1) out += ALPHABET[digits[i]]
  return out
}

export default function SignIn({ googleReady }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')

  // Injected wallets only, which is every desktop wallet worth having and needs
  // no project id or third-party service. RainbowKit plus WalletConnect is the
  // upgrade path when phone wallets matter.
  const withWallet = async () => {
    setProblem('')
    if (!window.ethereum) {
      setProblem('No wallet found in this browser. Install MetaMask, Rabby or Coinbase Wallet.')
      return
    }
    setBusy(true)
    try {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const { nonce } = await fetch('/api/auth/nonce').then((r) => r.json())
      const message = createSiweMessage({
        address,
        chainId: 1,
        domain: window.location.host,
        nonce,
        uri: window.location.origin,
        version: '1',
        statement: 'Sign in to zorilla. This proves you hold this address. It authorises nothing else and costs nothing.',
      })
      const signature = await window.ethereum.request({ method: 'personal_sign', params: [message, address] })
      const result = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      }).then((r) => r.json())

      if (result.error) setProblem(result.error)
      else router.push(result.handle ? `/u/${result.handle}` : '/welcome')
    } catch (err) {
      setProblem(err?.message?.includes('User rejected') ? 'Sign-in cancelled.' : (err.message ?? 'Wallet sign-in failed.'))
    }
    setBusy(false)
  }

  // Phantom signs plain text with the key behind the address, so there is no
  // chain, no gas and nothing to approve beyond the message itself.
  const withPhantom = async () => {
    setProblem('')
    const phantom = window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null)
    if (!phantom) {
      setProblem('Phantom is not in this browser. Install it from phantom.app, then try again.')
      return
    }
    setBusy(true)
    try {
      const { publicKey } = await phantom.connect()
      const address = publicKey.toString()
      const { nonce } = await fetch('/api/auth/nonce').then((r) => r.json())
      const text = [
        `${window.location.host} wants you to sign in with your Solana account:`,
        address,
        '',
        'Signing proves you hold this address. It authorises nothing else and costs nothing.',
        '',
        `Nonce: ${nonce}`,
      ].join('\n')

      const signed = await phantom.signMessage(new TextEncoder().encode(text), 'utf8')
      const signature = bs58encode(signed.signature)
      const result = await fetch('/api/auth/solana', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address, message: text, signature }),
      }).then((r) => r.json())

      if (result.error) setProblem(result.error)
      else router.push(result.handle ? `/u/${result.handle}` : '/welcome')
    } catch (err) {
      setProblem(err?.message?.includes('User rejected') ? 'Sign-in cancelled.' : (err.message ?? 'Phantom sign-in failed.'))
    }
    setBusy(false)
  }

  return (
    <div className="stack" style={{ gap: 10, maxWidth: 340 }}>
      <button className="btn primary" onClick={withWallet} disabled={busy}>
        {busy ? 'check your wallet…' : 'continue with a wallet'}
      </button>
      <button className="btn" onClick={withPhantom} disabled={busy}>
        continue with phantom
      </button>
      {googleReady
        ? <a className="btn" href="/api/auth/google">continue with google</a>
        : <button className="btn" disabled title="This deployment has no Google credentials set">continue with google</button>}
      {!googleReady && (
        <p className="dimmer" style={{ fontSize: 12, margin: 0 }}>
          Google is switched off until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
        </p>
      )}
      {problem && <p style={{ color: 'var(--bad)', fontSize: 13, margin: 0 }}>{problem}</p>}
    </div>
  )
}
