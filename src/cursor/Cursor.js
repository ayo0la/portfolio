// src/cursor/Cursor.js

let el = null

export function initCursor() {
  if (!window.matchMedia('(hover: hover)').matches) return

  el = document.getElementById('cursor')
  if (!el) return

  window.addEventListener('mousemove', e => {
    el.style.left = e.clientX + 'px'
    el.style.top  = e.clientY + 'px'
  })

  // Hover state on all interactive elements
  document.querySelectorAll('a, button, [role="button"]').forEach(node => {
    node.addEventListener('mouseenter', () => el.classList.add('hover'))
    node.addEventListener('mouseleave', () => el.classList.remove('hover'))
  })

  // Sections can ask for the grown ring with <body data-cursor="pull"> (the 3D shelf does this
  // while a record is hovered, since its canvas has no DOM children to enter and leave)
  const syncPull = () => el.classList.toggle('pull', document.body.dataset.cursor === 'pull')
  new MutationObserver(syncPull).observe(document.body, { attributes: true, attributeFilter: ['data-cursor'] })

  // Click flash - auto-removes after 100ms (not on mouseup, which would linger on long press)
  window.addEventListener('mousedown', () => {
    el.classList.add('clicking')
    setTimeout(() => el.classList.remove('clicking'), 100)
  })
}
