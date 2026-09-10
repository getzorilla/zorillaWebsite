// One belt, drawn twice, sliding by exactly half its width. The seam lands
// where the copy starts again, so it reads as continuous.
export default function LogoBelt({ services }) {
  const run = [...services, ...services]

  return (
    <div className="belt">
      <div className="belt-track">
        {run.map((service, i) => (
          <span className="belt-item" key={`${service.id}-${i}`} aria-hidden={i >= services.length}>
            <img src={`/editor/logos/${service.id}.svg`} alt="" width="30" height="30" />
            <b>{service.label}</b>
          </span>
        ))}
      </div>
    </div>
  )
}
