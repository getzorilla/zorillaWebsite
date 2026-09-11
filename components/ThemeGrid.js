'use client'

import { useState } from 'react'
import { ThemePreview } from './ThemeCard'

// All of them are shipped, but thirteen swatches is a wall on the way down the
// page, so the first row and a half stand and the rest wait to be asked for.
const SHOWN = 6

export default function ThemeGrid({ themes = [] }) {
  const [open, setOpen] = useState(false)
  const shown = open ? themes : themes.slice(0, SHOWN)
  const rest = themes.length - SHOWN

  return (
    <>
      <div className="theme-grid">
        {shown.map((theme) => (
          <div key={theme.id} className="theme-card">
            <ThemePreview colors={theme.colors} />
            <div className="theme-foot">
              <strong>{theme.label}</strong>
              <span>{theme.appearance}</span>
            </div>
          </div>
        ))}
      </div>
      {rest > 0 && (
        <button type="button" className="btn quiet theme-more" onClick={() => setOpen(!open)}>
          {open ? 'Show fewer' : `Show ${rest} more`}
        </button>
      )}
    </>
  )
}
