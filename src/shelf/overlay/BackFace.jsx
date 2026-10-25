import NumberFlow from '@number-flow/react'
import upstreamData from '../../data/upstream.json'

const MINUS = '−'

function Track({ t, downloads }) {
  const dl = t.npmPkg ? downloads?.[t.npmPkg] : undefined
  const inner = (
    <>
      <span className="bf-track-name">{t.name}</span>
      {typeof dl === 'number' ? (
        <span className="bf-track-meta" data-downloads={t.npmPkg}>
          <NumberFlow value={dl} format={{ useGrouping: true }} /> / wk
          <span className="bf-sr">{dl.toLocaleString('en-US')} downloads per week</span>
        </span>
      ) : t.meta ? (
        <span className="bf-track-meta">{t.meta}</span>
      ) : null}
    </>
  )
  return t.href ? (
    <li>
      <a className="bf-track" href={t.href} target="_blank" rel="noopener noreferrer">{inner}</a>
    </li>
  ) : (
    <li><div className="bf-track">{inner}</div></li>
  )
}

function UpstreamTotals({ data }) {
  return (
    <p className="bf-totals" data-testid="upstream-totals">
      <span className="bf-add" aria-hidden="true">+<NumberFlow value={data.additions} /></span>
      <span className="bf-del" aria-hidden="true">{MINUS}<NumberFlow value={data.deletions} /></span>
      <span className="bf-totals-note">lines across {data.merged} merged PRs</span>
      <span className="bf-sr">{`+${data.additions} ${MINUS}${data.deletions}`}</span>
    </p>
  )
}

// The record's back: blurb, tracks as real links, footer link. Shown over the flipped record.
export function BackFace({ project, downloads = null, upstream = upstreamData }) {
  return (
    <div className="bf" data-testid="back-face">
      <p className="bf-blurb">{project.blurb}</p>
      {project.slug === 'upstream' && <UpstreamTotals data={upstream} />}
      <ul className="bf-tracks">
        {project.tracks.map((t) => <Track key={t.name} t={t} downloads={downloads} />)}
      </ul>
      {project.link && (
        <div className="bf-footer">
          <span className="bf-credit">{project.tag}</span>
          <a className="bf-open" href={project.link.href} target="_blank" rel="noopener noreferrer">{project.link.label} {'↗'}</a>
        </div>
      )}
    </div>
  )
}
