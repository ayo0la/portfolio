const listeners = {}

export const EventBus = {
  on(event, fn) {
    if (!listeners[event]) listeners[event] = []
    listeners[event].push(fn)
  },
  off(event, fn) {
    if (!listeners[event]) return
    listeners[event] = listeners[event].filter(f => f !== fn)
  },
  emit(event, ...args) {
    if (!listeners[event]) return
    listeners[event].forEach(fn => fn(...args))
  },
  once(event, fn) {
    const wrapper = (...args) => { fn(...args); this.off(event, wrapper) }
    this.on(event, wrapper)
  }
}
