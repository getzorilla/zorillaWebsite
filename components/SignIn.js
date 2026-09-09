'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSiweMessage } from 'viem/siwe'

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

  return (
    <div className="stack" style={{ gap: 10, maxWidth: 340 }}>
      <button className="btn primary" onClick={withWallet} disabled={busy}>
        {busy ? 'check your wallet…' : 'continue with a wallet'}
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
