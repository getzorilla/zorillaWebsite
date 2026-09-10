'use client'

import { useEffect, useState } from 'react'
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

const solanaText = (address, nonce) => [
  `${window.location.host} wants you to sign in with your Solana account:`,
  address,
  '',
  'Signing proves you hold this address. It authorises nothing else and costs nothing.',
  '',
  `Nonce: ${nonce}`,
].join('\n')

// A wallet that announces itself hands over its own icon. These are for the
// ones found by poking at window, which hand over nothing.
const KNOWN_MARK = [
  [/metamask/i, '/wallets/metamask.svg'],
  [/phantom/i, '/wallets/phantom.svg'],
  [/rabby/i, '/wallets/rabby.svg'],
  [/coinbase/i, '/wallets/coinbase.svg'],
  [/solflare/i, '/wallets/solflare.svg'],
  [/backpack/i, '/wallets/backpack.svg'],
  [/trust/i, '/wallets/trust.svg'],
  [/rainbow/i, '/wallets/rainbow.svg'],
  [/okx/i, '/wallets/okx.svg'],
  [/exodus/i, '/wallets/exodus.svg'],
]
const markFor = (name) => KNOWN_MARK.find(([match]) => match.test(name))?.[1] ?? null

const STATEMENT = 'Sign in to Zorilla. This proves you hold this address. It authorises nothing else and costs nothing.'

// Both chains have a discovery standard where the wallet announces itself with
// its own name and icon, so the list is whatever is actually installed rather
// than a hardcoded set we would have to keep up to date.
function findEvmWallets(add) {
  const seen = new Set()
  const onAnnounce = (event) => {
    const { info, provider } = event.detail
    if (seen.has(info.uuid)) return
    seen.add(info.uuid)
    add({ id: `evm:${info.uuid}`, kind: 'evm', name: info.name, icon: info.icon ?? markFor(info.name), provider })
  }
  window.addEventListener('eip6963:announceProvider', onAnnounce)
  const ask = () => window.dispatchEvent(new Event('eip6963:requestProvider'))
  ask()
  return { ask, stop: () => window.removeEventListener('eip6963:announceProvider', onAnnounce) }
}

function findSolanaWallets(add) {
  const take = (wallet) => {
    if (!wallet?.features?.['solana:signMessage']) return
    add({ id: `sol:${wallet.name}`, kind: 'solana', name: wallet.name, icon: wallet.icon ?? markFor(wallet.name), wallet })
  }
  const known = []
  const api = {
    version: '1.0.0',
    register: (...found) => { known.push(...found); found.forEach(take); return () => {} },
    get: () => known,
    on: () => () => {},
  }
  const onRegister = (event) => event.detail(api)
  window.addEventListener('wallet-standard:register-wallet', onRegister)
  const ask = () => window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', { detail: api }))
  ask()
  return { ask, stop: () => window.removeEventListener('wallet-standard:register-wallet', onRegister) }
}

// Wallets that never adopted either standard, or that inject after the page has
// already asked. Phantom in particular can arrive late.
function findLegacyWallets(add) {
  const phantom = window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null)
  if (phantom) add({ id: 'sol:legacy-phantom', kind: 'solana-legacy', name: 'Phantom', icon: markFor('Phantom'), provider: phantom })
  if (window.ethereum) {
    const name = window.ethereum.isMetaMask ? 'MetaMask'
      : window.ethereum.isRabby ? 'Rabby'
      : window.ethereum.isCoinbaseWallet ? 'Coinbase Wallet'
      : 'Browser wallet'
    add({ id: 'evm:legacy', kind: 'evm-legacy', name, icon: markFor(name), provider: window.ethereum })
  }
}

export default function SignIn({ googleReady }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [wallets, setWallets] = useState([])
  const [busy, setBusy] = useState('')
  const [problem, setProblem] = useState('')

  useEffect(() => {
    // Phantom announces on both standards and again through its old interface.
    // One row per wallet, keeping the best way we have of talking to it: EIP-6963
    // first, then wallet standard, then the old injected object.
    // A wallet that announced itself properly beats the same wallet found by
    // poking at window, and an entry with the wallet's own icon beats one without.
    const rank = { evm: 4, solana: 3, 'evm-legacy': 2, 'solana-legacy': 1 }
    const score = (w) => rank[w.kind] * 2 + (w.icon ? 1 : 0)
    const add = (found) => setWallets((list) => {
      const clash = list.find((w) => w.name.toLowerCase() === found.name.toLowerCase())
      if (!clash) return [...list, found]
      if (score(found) <= score(clash)) return list
      return list.map((w) => (w === clash ? found : w))
    })
    const evm = findEvmWallets(add)
    const sol = findSolanaWallets(add)
    findLegacyWallets(add)
    // Extensions inject at their own pace, so ask again rather than deciding
    // nothing is installed on the strength of one try.
    const again = [300, 1200].map((wait) => setTimeout(() => {
      evm.ask()
      sol.ask()
      findLegacyWallets(add)
    }, wait))
    return () => { evm.stop(); sol.stop(); again.forEach(clearTimeout) }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const land = (result) => {
    if (result.error) return setProblem(result.error)
    router.push(result.handle ? `/u/${result.handle}` : '/welcome')
    router.refresh()
  }

  const withEvm = async ({ provider }) => {
    const [address] = await provider.request({ method: 'eth_requestAccounts' })
    const { nonce } = await fetch('/api/auth/nonce').then((r) => r.json())
    const message = createSiweMessage({
      address,
      chainId: 1,
      domain: window.location.host,
      nonce,
      uri: window.location.origin,
      version: '1',
      statement: STATEMENT,
    })
    const signature = await provider.request({ method: 'personal_sign', params: [message, address] })
    land(await fetch('/api/auth/wallet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, signature }),
    }).then((r) => r.json()))
  }

  // Solana wallets sign plain text with the key behind the address, so there is
  // no chain, no gas and nothing to approve beyond the message itself.
  const withSolana = async ({ wallet }) => {
    const { accounts } = await wallet.features['standard:connect'].connect()
    const account = accounts[0]
    if (!account) throw new Error('That wallet has no account to sign with.')
    const { nonce } = await fetch('/api/auth/nonce').then((r) => r.json())
    const text = solanaText(account.address, nonce)

    const [signed] = await wallet.features['solana:signMessage'].signMessage({
      account,
      message: new TextEncoder().encode(text),
    })
    land(await fetch('/api/auth/solana', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: account.address, message: text, signature: bs58encode(signed.signature) }),
    }).then((r) => r.json()))
  }

  const withLegacyPhantom = async ({ provider }) => {
    const { publicKey } = await provider.connect()
    const address = publicKey.toString()
    const { nonce } = await fetch('/api/auth/nonce').then((r) => r.json())
    const text = solanaText(address, nonce)
    const signed = await provider.signMessage(new TextEncoder().encode(text), 'utf8')
    land(await fetch('/api/auth/solana', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, message: text, signature: bs58encode(signed.signature) }),
    }).then((r) => r.json()))
  }

  const pick = async (chosen) => {
    setProblem('')
    setBusy(chosen.id)
    try {
      if (chosen.kind === 'evm' || chosen.kind === 'evm-legacy') await withEvm(chosen)
      else if (chosen.kind === 'solana-legacy') await withLegacyPhantom(chosen)
      else await withSolana(chosen)
    } catch (err) {
      const said = err?.message ?? ''
      setProblem(said.includes('User rejected') || said.includes('rejected')
        ? 'Sign-in cancelled.'
        : (said || `${chosen.name} could not sign you in.`))
    }
    setBusy('')
  }

  return (
    <div className="stack" style={{ gap: 10, maxWidth: 340 }}>
      <button className="btn primary" onClick={() => setOpen(true)}>Connect wallet</button>
      {googleReady
        ? <a className="btn" href="/api/auth/google">Continue with Google</a>
        : <button className="btn" disabled title="This deployment has no Google credentials set">Continue with Google</button>}
      {!googleReady && (
        <p className="dimmer" style={{ fontSize: 12, margin: 0 }}>
          Google is switched off until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
        </p>
      )}
      {problem && <p style={{ color: 'var(--bad)', fontSize: 13, margin: 0 }}>{problem}</p>}

      {open && (
        <div className="sheet-back" onClick={() => setOpen(false)}>
          <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <b>Connect a wallet</b>
              <button className="sheet-x" onClick={() => setOpen(false)} aria-label="close">×</button>
            </div>

            {wallets.length > 0 ? (
              <div className="wallet-list">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    className="wallet-row"
                    onClick={() => pick(wallet)}
                    disabled={busy !== ''}
                  >
                    {wallet.icon
                      ? <img src={wallet.icon} alt="" width="28" height="28" />
                      : <span className="wallet-blank" />}
                    <span className="wallet-name">{wallet.name}</span>
                    <span className="wallet-note">
                      {busy === wallet.id ? 'check your wallet' : wallet.kind.startsWith('evm') ? 'Ethereum' : 'Solana'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="wallet-empty">
                No wallet found in this browser. Install{' '}
                <a href="https://metamask.io" target="_blank" rel="noreferrer">MetaMask</a>,{' '}
                <a href="https://rabby.io" target="_blank" rel="noreferrer">Rabby</a> or{' '}
                <a href="https://phantom.app" target="_blank" rel="noreferrer">Phantom</a>, then reload.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
