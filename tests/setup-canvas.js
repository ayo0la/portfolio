// jsdom has no canvas implementation and logs "Not implemented" on every
// getContext call. Code under test treats null as "no canvas", so stub it.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null
}
