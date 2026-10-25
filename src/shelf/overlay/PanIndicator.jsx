import { indicatorState } from '../panIndex.js'

// Phone only: where you are along the single shelf row, and a hint that it swipes sideways.
// Plain HTML buttons over the canvas so it is keyboard and screen-reader friendly.
export function PanIndicator({ projects, index, onPick }) {
  const { label, back, forward } = indicatorState(index, projects.length)
  return (
    <nav className="shelf-pan" aria-label="Shelf position">
      <div className="shelf-pan-dots">
        {projects.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            className={`shelf-pan-dot${i === index ? ' is-active' : ''}`}
            aria-label={`Show ${p.name}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => onPick(i)}
          />
        ))}
      </div>
      <p className="shelf-pan-label">
        {back && <span className="shelf-pan-chev" aria-hidden="true">{'‹'}</span>}
        <span>{label}</span>
        {forward && <span className="shelf-pan-chev" aria-hidden="true">{'›'}</span>}
      </p>
    </nav>
  )
}
