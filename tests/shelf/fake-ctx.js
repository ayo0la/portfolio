// Recording fake 2D context: every method call is pushed as [name, ...args].
export function makeCtx() {
  const calls = []
  const grad = { addColorStop() {} }
  const ctx = new Proxy({ calls }, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return (...a) => { calls.push([prop, ...a]); return grad }
      }
      if (prop === 'measureText') return (s) => ({ width: String(s).length * 8 })
      return (...a) => { calls.push([prop, ...a]) }
    },
    set(target, prop, value) { target[prop] = value; return true },
  })
  return ctx
}
export const texts = (ctx) => ctx.calls.filter((c) => c[0] === 'fillText').map((c) => String(c[1]))
