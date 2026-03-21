# Spec: @ayoola/grain-canvas npm package

## Overview
Extract the portfolio background canvas (grain overlay + particle system + cursor glow + vignette) into a standalone, open-source npm package. Zero dependencies, vanilla JS, ESM + CJS builds. Sensible defaults that work with zero config; fully configurable for power users.

Browser-only package. No Node.js support.

---

## Package Identity
- **Name:** `@ayoola/grain-canvas`
- **Initial version:** `0.1.0`
- **License:** MIT
- **Registry:** npm (public scoped package)
- **Environment:** Browser only (`requestAnimationFrame`, `ResizeObserver`, `matchMedia`)

---

## Public API

### `init(canvasEl, options?): destroy`
The only function users need. Accepts a canvas DOM element and an optional config object. Starts the animation loop immediately. Returns a `destroy()` function that cancels the loop and removes all event listeners.

**Canvas sizing:** `init` owns sizing. On call it sets `canvas.width` and `canvas.height` from the element's `clientWidth` / `clientHeight`. A `ResizeObserver` is attached internally to resize and rebuild grain frames whenever the canvas element changes size. The user must ensure the canvas has non-zero dimensions via CSS before calling `init` — if the canvas is 0×0 on init, a console warning is emitted and the loop starts anyway (it will correct on first resize).

```js
import { init } from '@ayoola/grain-canvas'

const canvas = document.getElementById('bg')
const destroy = init(canvas, { accentRatio: 0.4 })

// cleanup
destroy()
```

**Basic CSS setup (user's responsibility):**
```css
#bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

### `destroy()`
Returned by `init`. Cancels the `requestAnimationFrame` loop, disconnects the `ResizeObserver`, and removes all event listeners (`mousemove`, `touchstart`, `touchend`, `visibilitychange`). Does **not** clear the canvas — the last painted frame remains visible. Calling `destroy()` more than once is a safe no-op. The `canvasEl` reference is released after destroy to avoid memory leaks in SPA route changes.

### `defaults`
The full default config object, exported so users can inspect or spread it.

```js
import { init, defaults } from '@ayoola/grain-canvas'
const destroy = init(canvas, { ...defaults, backgroundColor: '#000' })
```

---

## Config Shape

All options are optional. Unset options fall back to defaults.

```js
const defaults = {
  // Background
  backgroundColor: '#080808',

  // Particles
  particleCount: 90,
  particleSizeMin: 0.8,
  particleSizeMax: 2.8,
  particleBaseColor: 'rgba(255,255,255,0.55)',
  particleAccentColor: 'rgba(255,215,0,0.75)',
  accentRatio: 0.25,            // fraction of particles using accentColor (0–1)
  mouseAttractionRadius: 200,
  mouseAttractionStrength: 0.0008,
  connectionDistance: 110,
  connectionOpacity: 0.25,

  // Glow (cursor on desktop, tap position on mobile)
  glowRadius: 140,
  glowColor: 'rgba(255,215,0,0.07)',

  // Grain
  grainOpacity: 0.35,
  grainSwapInterval: 50,        // ms between grain frame swaps (minimum 33ms)

  // Vignette
  vignetteOpacity: 0.6,
}
```

### Validation rules (enforced in `mergeConfig`)
- `particleCount`: clamped to 1–500
- `accentRatio`: clamped to 0–1
- `grainOpacity`: clamped to 0–1
- `vignetteOpacity`: clamped to 0–1
- `grainSwapInterval`: minimum 33ms (2 frames at 60fps — below this, pre-built frames offer no perf benefit)
- `mouseAttractionRadius` / `connectionDistance`: minimum 1

**Color strings** (`backgroundColor`, `particleBaseColor`, `particleAccentColor`, `glowColor`) are passed directly to the Canvas 2D context with no validation. Invalid color strings render as transparent — this matches browser canvas behaviour and is documented in the README.

### Grain rendering
Grain is rendered using `globalCompositeOperation: 'screen'` at `grainOpacity`. This blending mode is fixed — it is not configurable. It works correctly only over dark backgrounds (near-black). Using a light `backgroundColor` will produce washed-out results; this is documented as a known limitation in the README.

### Mobile behaviour (automatic, not configurable)
- Touch devices detected via `window.matchMedia('(hover: hover)')`
- Grain rendered at 0.5× resolution, 3 frames instead of 6
- `touchstart` updates the attraction point to the touch position (same attraction model as desktop cursor)
- `touchend` resets the attraction point to the center of the canvas (`W/2, H/2`) — prevents particles clustering at a stale touch position after the finger lifts
- Cursor/tap glow renders on both desktop and mobile
- Animation loop pauses when `document.hidden` is true (`visibilitychange` event)

---

## File Structure

```
@ayoola/grain-canvas/
├── src/
│   ├── grain.js        # grain frame generation + swap logic
│   ├── particles.js    # particle init, update, draw, connection lines
│   ├── effects.js      # cursor glow + vignette
│   └── index.js        # init(), mergeConfig(), animation loop, destroy()
├── dist/               # generated by build — gitignored, included in npm via files
│   ├── index.esm.js
│   ├── index.cjs.js
│   └── index.d.ts
├── demo/
│   └── index.html      # visual test — imports from src/ via relative path, must be served locally (not opened as file://)
├── tsup.config.js      # output extension config to produce .esm.js and .cjs.js
├── tsconfig.json       # allowJs + checkJs for --dts type generation
├── README.md
└── package.json
```

### Module responsibilities

**`grain.js`**
- `buildGrainFrames(W, H, config, isTouch)` — returns array of offscreen canvases
- `drawGrain(ctx, frames, index, W, H, config)` — draws current frame with `globalAlpha` + `screen` blend mode

**`particles.js`**
- `buildParticles(W, H, config)` — returns particle array
- `updateParticles(particles, W, H, mx, my, config)` — applies attraction + velocity + wrapping
- `drawParticles(ctx, particles, config)` — draws dots + connection lines

**`effects.js`**
- `drawGlow(ctx, mx, my, W, H, config)` — radial gradient at cursor/tap position
- `drawVignette(ctx, W, H, config)` — edge darkening gradient

**`index.js`**
- `mergeConfig(userConfig)` — shallow merge + validation/clamping
- `init(canvasEl, options)` — wires up all modules, attaches `ResizeObserver` + input events + `visibilitychange`, starts `requestAnimationFrame` loop, returns `destroy()`
- `destroy()` — cancels loop, disconnects observer, removes listeners, releases canvas ref; idempotent
- `defaults` — exported default config object

---

## Build

**Bundler:** tsup (zero-config, esbuild-based). Type declarations generated via `--dts` backed by a `tsconfig.json` with `allowJs: true` and `checkJs: true` so TypeScript can emit `.d.ts` from plain JS + JSDoc annotations.

A `tsup.config.js` is required to produce the `.esm.js` / `.cjs.js` suffixes declared in the `exports` map — tsup's default CLI output is `index.js` + `index.cjs`, which would not match.

**tsup.config.js:**
```js
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm', 'cjs'],
  dts: true,
  outExtension({ format }) {
    return { js: format === 'esm' ? '.esm.js' : '.cjs.js' }
  },
})
```

**tsconfig.json** (required for `--dts` on `.js` source):
```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist",
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["DOM", "ES2018"]
  },
  "include": ["src"]
}
```

```json
"scripts": {
  "build": "tsup",
  "dev": "tsup --watch",
  "demo": "npx serve .",
  "typecheck": "tsc --noEmit",
  "prepublishOnly": "npm run build"
}
```

**package.json exports:**
```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.esm.js",
    "require": "./dist/index.cjs.js"
  }
},
"main": "./dist/index.cjs.js",
"module": "./dist/index.esm.js",
"types": "./dist/index.d.ts",
"files": ["dist", "README.md"]
```

Note: `"module"` is a bundler convention (Rollup/webpack) kept for backward compatibility with tools that predate the `exports` map — it is not an official Node.js field. The `exports` map takes precedence in Node.js 12+ and all modern bundlers.

---

## Testing
No unit test framework. Canvas APIs are not meaningfully testable in Node. Verification is visual via `demo/index.html`, which imports directly from `src/index.js` using ES module relative imports. The demo must be served via a local HTTP server (e.g. `npx serve .`) — it will not work opened as a `file://` URL due to browser ES module CORS restrictions.

---

## README Structure
1. Short description + live demo link (portfolio site)
2. Install: `npm install @ayoola/grain-canvas`
3. Basic usage (canvas element + 3 lines of JS)
4. CSS setup note (canvas must have non-zero dimensions via CSS)
5. Config table (all options, types, defaults, descriptions)
6. Known limitations (light backgrounds + screen blend, color string validation)
7. React usage example (`useEffect` + `useRef`, ~15 lines)
8. Destroy / cleanup note
9. License

---

## Publishing
```bash
npm publish --access public
```
- Scoped public package requires `--access public` on first publish
- `dist/` is gitignored but included in npm via `files` field
- `prepublishOnly` script ensures dist is always fresh before publish

---

## Versioning
- Start at `0.1.0`
- Under semver convention, `0.x.y` carries no API stability guarantee — any minor bump may include breaking changes. The README will note this.
- Once the API is considered stable, bump to `1.0.0`
- Post-1.0 rules: any config key rename or removal = major bump; new optional config keys = minor bump; bug fixes = patch bump
