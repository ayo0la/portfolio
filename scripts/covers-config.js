// Capture targets for the living covers. Phone width, 2x DPR, full page.
export const VIEWPORT = { width: 390, height: 844 }
export const SCALE = 2

const env = (k, d) => process.env[k] || d

export const COVER_TARGETS = [
  { out: 'square-a', url: env('SQUAREA_DEMO_URL', 'http://127.0.0.1:3102/t/demo-sunny-days'), width: 512, still: true },
  { out: 'allstar-kids', url: 'https://allstarkids-platform.vercel.app', width: 512, still: true },
  { out: 'matchday', url: 'https://matchday-sooty.vercel.app', width: 512, still: true, click: 'Standings' },
  { out: 'math-trail', url: env('MATHTRAIL_DEMO_URL', 'http://127.0.0.1:4321'), width: 512, still: true },
  { out: 'client-dryco', url: 'https://dryco-roofing.vercel.app', width: 512 },
  { out: 'client-akin', url: 'https://akinmorakinyo.vercel.app', width: 512 },
  { out: 'client-dolapo', url: 'https://dolapo-portfolio-tau.vercel.app', width: 512 },
  { out: 'client-kayla', url: 'https://kayla-bloom-portfolio.vercel.app', width: 512 },
]
