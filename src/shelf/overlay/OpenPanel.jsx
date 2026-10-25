import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { MOTION } from '../motion.js'
import { PROJECTS } from '../projects.js'

const LINK_TEXT = { OPEN: 'Open site', GITHUB: 'Open GitHub', NPM: 'Open on npm' }
const EASE = [0.22, 1, 0.36, 1]

// The copy beside the pulled-out record: left on desktop, a bottom sheet on phones.
export function OpenPanel({ project, flipped, onFlip, onClose, onNext, onPrev, dayMix = 0 }) {
  const reduce = useReducedMotion()
  const closeRef = useRef(null)
  const slugRef = useRef(project.slug)
  slugRef.current = project.slug

  // keyboard users land on Close, and get back where they were afterwards. If next/prev moved to
  // another record, focus goes to that record's card (or its index entry), not to the first opener.
  useEffect(() => {
    const before = document.activeElement
    const openedWith = slugRef.current
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      const slug = slugRef.current
      let target = before
      if (slug !== openedWith) {
        const cardId = PROJECTS.find((p) => p.slug === slug)?.cardId
        target = document.querySelector(`.shelf-card[data-slug="${slug}"]`)
          ?? (cardId ? document.querySelector(`.shelf-index-entry[data-target="${cardId}"]`) : null)
      }
      if (target && typeof target.focus === 'function' && document.contains(target)) target.focus({ preventScroll: true })
    }
  }, [])

  const day = dayMix > 0.5
  return (
    <motion.div
      className={`shelf-panel${day ? ' is-day' : ''}${flipped ? ' is-flipped' : ''}`}
      data-testid="open-panel"
      role="dialog"
      aria-modal="false"
      aria-label={project.name}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: MOTION.openDuration, ease: EASE } }}
      exit={{ ...(reduce ? { opacity: 0 } : { opacity: 0, y: 14 }), transition: { duration: MOTION.closeDuration, ease: EASE } }}
    >
      {/* the copy lands panelTextDelay after the record starts to move, and cross-fades over
          nextOverlap when next/prev swaps the project */}
      <div style={{ display: 'grid' }}>
        <AnimatePresence>
          <motion.div
            key={project.slug}
            style={{ gridArea: '1 / 1' }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: MOTION.nextOverlap, delay: MOTION.panelTextDelay, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: MOTION.nextOverlap, ease: EASE } }}
          >
            <p className="shelf-panel-tag">{project.tag}</p>
            <h2 className="shelf-panel-name">{project.name}</h2>
            <p className="shelf-panel-pitch">{project.pitch}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="shelf-panel-actions">
        {project.link && (
          <a className="shelf-btn shelf-btn-pri" href={project.link.href} target="_blank" rel="noopener noreferrer">
            {LINK_TEXT[project.link.label] ?? 'Open site'} <span aria-hidden="true">{'↗'}</span>
          </a>
        )}
        <button type="button" className="shelf-btn" aria-label="Flip the record" aria-pressed={flipped} onClick={onFlip}>
          {flipped ? 'Show front' : 'Flip it over'}
        </button>
      </div>
      <div className="shelf-panel-nav">
        <button type="button" className="shelf-btn shelf-btn-round" aria-label="Previous project" onClick={onPrev}>
          <span aria-hidden="true">{'‹'}</span>
        </button>
        <button type="button" className="shelf-btn shelf-btn-round" aria-label="Next project" onClick={onNext}>
          <span aria-hidden="true">{'›'}</span>
        </button>
        <button ref={closeRef} type="button" className="shelf-btn shelf-btn-close" aria-label="Close" onClick={onClose}>
          <span aria-hidden="true">{'✕'}</span> Close
        </button>
      </div>
    </motion.div>
  )
}
