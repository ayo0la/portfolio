// scripts/site-feeds.js
// Site-wide files derived from the blog: RSS feed, sitemap, and the
// homepage blog cards baked into index.html so they show without JavaScript.
import { escapeHtml } from '../src/utils/escape-html.js'

export const SITE_URL = 'https://ayoola-morakinyo.vercel.app'
export const SITE_NAME = 'Ayoola Morakinyo'
export const SITE_DESCRIPTION = 'Founder of MDFLD. Machine learning and software engineer building computer vision for football boots and kit. Atlanta.'

const rfc822 = date => new Date(`${date}T00:00:00Z`).toUTCString()

export function renderRss(posts) {
  const items = posts.map(p => `
    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${SITE_URL}/blog/${escapeHtml(p.slug)}/</link>
      <guid>${SITE_URL}/blog/${escapeHtml(p.slug)}/</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${escapeHtml(p.tldr)}</description>
    </item>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}/blog/</link>
    <description>${escapeHtml(SITE_DESCRIPTION)}</description>
    <language>en</language>${items}
  </channel>
</rss>
`
}

export function renderSitemap(posts) {
  const latest = posts[0]?.date
  const urls = [
    { path: '/', lastmod: latest },
    { path: '/blog/', lastmod: latest },
    ...posts.map(p => ({ path: `/blog/${p.slug}/`, lastmod: p.date })),
  ]
  const entries = urls.map(u => `
  <url>
    <loc>${SITE_URL}${escapeHtml(u.path)}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</urlset>
`
}

// Same markup as src/sections/blog.js renders at runtime.
export function renderHomeBlogCards(posts) {
  return posts.map(p => `
        <a class="project-card" href="/blog/${escapeHtml(p.slug)}/">
          <span class="proj-tag">${escapeHtml(p.dateDisplay)}</span>
          <h3 class="proj-name">${escapeHtml(p.title)}</h3>
          <p class="proj-desc">${escapeHtml(p.tldr)}</p>
          <span class="proj-arrow">→</span>
        </a>`).join('') + '\n      '
}

// Cards hold no <div>, so the first </div> after the opener closes the container.
const BLOG_CARDS = /(<div id="blog-cards"[^>]*>)[\s\S]*?(<\/div>)/

export function injectHomeBlogCards(html, posts) {
  return html.replace(BLOG_CARDS, (_, open, close) => `${open}${renderHomeBlogCards(posts)}${close}`)
}
