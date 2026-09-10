// A screenshot of the real app. Boxes mark the spots; what they mean is listed
// underneath, so nothing sits on top of the thing it is pointing at.
export default function Shot({ src, alt, spots = [], tilt = false }) {
  const labelled = spots.filter((s) => s.say)
  return (
    <div className={`frame${tilt ? ' tilt' : ''}`}>
      <figure className="shot">
        <img src={src} alt={alt} />
        {spots.map((spot) => (
          <span
            key={spot.n}
            className="spot"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: `${spot.w}%`,
              height: `${spot.h}%`,
            }}
          >
            <b>{spot.n}</b>
          </span>
        ))}
      </figure>
      {labelled.length > 0 && (
        <ol className="legend">
          {labelled.map((spot) => (
            <li key={spot.n}><b>{spot.n}</b>{spot.say}</li>
          ))}
        </ol>
      )}
    </div>
  )
}
