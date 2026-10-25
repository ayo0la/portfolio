// A broken image is complete with naturalWidth 0, and drawImage throws on it.
export const usable = (img) => !!(img && img.complete && img.naturalWidth > 0)

// Decode off the hot path so the first paint after a swap does not decode on the main thread.
// A rejected decode still calls back: callers re-check usable().
export function whenDecoded(img, cb) {
  if (img && typeof img.decode === 'function') {
    img.decode().then(cb, cb)
  } else {
    cb()
  }
}
