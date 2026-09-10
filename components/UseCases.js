'use client'

import { useState } from 'react'

// The tabs. Each panel's picture is drawn on the server from the same file the
// app installs, so it can never drift from what somebody actually gets.
export default function UseCases({ cases }) {
  const [pick, setPick] = useState(cases[0].id)
  const current = cases.find((c) => c.id === pick)

  return (
    <div className="cases">
      <div className="case-tabs">
        {cases.map((c) => (
          <button
            key={c.id}
            className={`case-tab${c.id === pick ? ' on' : ''}`}
            onClick={() => setPick(c.id)}
          >
            <b>{c.who} can</b>
            <span>{c.line}</span>
          </button>
        ))}
      </div>

      <div className="case-panel">
        {cases.map((c) => (
          <div key={c.id} hidden={c.id !== pick}>
            <div className="frame">{c.preview}</div>
            <div className="case-steps">
              <ol>
                {c.steps.map((step, i) => {
                  const [head, ...rest] = step.split('  ')
                  return (
                    <li key={i}>
                      <code>{head}</code>
                      {rest.length > 0 && <span>{rest.join('  ')}</span>}
                    </li>
                  )
                })}
              </ol>
              <p className="case-note">{c.why} Needs {c.needs}.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
