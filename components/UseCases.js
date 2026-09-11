'use client'

import { useState } from 'react'

// Each panel's picture is drawn on the server from the same file the app
// installs, so it can never drift from what somebody actually gets.
export default function UseCases({ cases }) {
  const [pick, setPick] = useState(cases[0].id)

  return (
    <div className="cases">
      <div className="case-tabs">
        {cases.map((c) => (
          <button
            key={c.id}
            className={`case-tab${c.id === pick ? ' on' : ''}`}
            onClick={() => setPick(c.id)}
          >
            {c.who}
          </button>
        ))}
      </div>

      <div className="case-panel">
        {cases.map((c) => (
          <div key={c.id} hidden={c.id !== pick} inert={c.id !== pick}>
            <p className="case-line">{c.line}</p>
            <div className="frame">{c.preview}</div>
            <div className="case-steps">
              <ol>
                {c.steps.map((step, i) => {
                  const [head, ...rest] = step.split('  ')
                  return (
                    <li key={i}>
                      <code>{head}</code>
                      {rest.length > 0 && (
                        <span title={rest.join('  ')}>{rest.join('  ')}</span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
