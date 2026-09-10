// A screenshot of the real app with numbered spots on it. Coordinates are
// percentages so the picture can be any size on the page.
export default function Shot({ src, alt, spots = [], tilt = false }) {
  return (
    <div className={`frame${tilt ? ' tilt' : ''}`}>
    <figure className="shot">
      <img src={src} alt={alt} />
      {spots.map((spot) => (
        <span
          key={spot.n}
          className={`spot${spot.wide ? ' wide' : ''}`}
          style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: spot.w ? `${spot.w}%` : undefined, height: spot.h ? `${spot.h}%` : undefined }}
        >
          <b>{spot.n}</b>
          {spot.say && <em>{spot.say}</em>}
        </span>
      ))}
    </figure>
    </div>
  )
}
