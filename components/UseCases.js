'use client'

import { useState } from 'react'
import Link from 'next/link'

// The same automations that arrive with the app, so what somebody sees here is
// what they open on their own machine ten minutes later.
const CASES = [
  {
    id: 'traders',
    who: 'Traders',
    line: 'Get a Telegram message the moment USDC lands in a wallet',
    why: 'Checks every five minutes, tells you once per transaction, and never repeats itself after a restart.',
    steps: [
      'every 5 minutes',
      'contract events  USDC · Transfer · only where to = your address',
      'first time only  by transaction hash',
      'telegram  "USDC in: {{ $json.args.value }}"',
    ],
    needs: 'a Telegram bot token',
  },
  {
    id: 'influencers',
    who: 'Influencers',
    line: 'Check chain news, have Claude draft a post, put it on X',
    why: 'Half-hourly. Keeps only the headlines you care about, and never drafts the same one twice.',
    steps: [
      'every 30 minutes',
      'http request  a news feed',
      'filter  title contains "Robinhood"',
      'first time only  by article id',
      'ask claude  "write one post, under 240 characters"',
      'post to x  {{ $json.text }}',
    ],
    needs: 'a Claude key and an X access token',
  },
  {
    id: 'community',
    who: 'Community leaders',
    line: 'Announce a price move to Discord with @everyone, once',
    why: 'Checks every ten minutes but stays quiet until the price is 5% away from the last thing it told you.',
    steps: [
      'every 10 minutes',
      'coin price  ethereum in usd',
      'when this moves  by 5 percent, up or down',
      'discord  "@everyone ETH is up 6% to $4,310"',
    ],
    needs: 'a Discord webhook',
  },
  {
    id: 'selling',
    who: 'Anyone selling something',
    line: 'Turn a Stripe payment into a Slack message and a Notion row',
    why: 'One step feeding two, so both happen from the same payment. Fires once per payment.',
    steps: [
      'new stripe payment',
      'slack  "$49.00 from buyer@example.com"',
      'notion  add a row',
    ],
    needs: 'Stripe, Slack and Notion keys',
  },
  {
    id: 'builders',
    who: 'Builders',
    line: 'Read any contract on a schedule and email yourself the numbers',
    why: 'Paste a Solidity function line and it reads it. Amounts stay whole numbers the whole way.',
    steps: [
      'every day',
      'read from a contract  function totalSupply() view returns (uint256)',
      'resend  email it to you',
    ],
    needs: 'a Resend key',
  },
]

export default function UseCases() {
  const [pick, setPick] = useState(CASES[0].id)
  const current = CASES.find((c) => c.id === pick)

  return (
    <div className="cases">
      <div className="case-tabs">
        {CASES.map((c) => (
          <button
            key={c.id}
            className={`case-tab${c.id === pick ? ' on' : ''}`}
            onClick={() => setPick(c.id)}
          >
            <b>{c.who} can</b>
            <span>{c.line}</span>
          </button>
        ))}
        <Link href="/marketplace" className="case-tab quiet">
          <b>You can</b>
          <span>Take one off the marketplace and change it</span>
        </Link>
      </div>

      <div className="case-panel">
        <div className="frame">
          <figure className="shot">
            <img src={`/usecases/${current.id}.png`} alt={`${current.who}: ${current.line}`} />
          </figure>
        </div>
        <div className="case-steps">
          <ol>
            {current.steps.map((step, i) => {
              const [head, ...rest] = step.split('  ')
              return (
                <li key={i}>
                  <code>{head}</code>
                  {rest.length > 0 && <span>{rest.join('  ')}</span>}
                </li>
              )
            })}
          </ol>
          <p className="case-note">{current.why} Needs {current.needs}.</p>
        </div>
      </div>
    </div>
  )
}
