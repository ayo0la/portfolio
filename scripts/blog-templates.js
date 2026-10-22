// scripts/blog-templates.js
import { escapeHtml } from '../src/utils/escape-html.js'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from './site-feeds.js'

function headMeta({ title, description = SITE_DESCRIPTION, path, type }) {
  const url = `${SITE_URL}${path}`
  return `<title>${escapeHtml(title)} | ${SITE_NAME}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta property="og:site_name" content="${SITE_NAME}">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME}" href="/rss.xml">`
}

export function renderPostHtml(post) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${headMeta({ title: post.title, description: post.tldr, path: `/blog/${post.slug}/`, type: 'article' })}
<link rel="stylesheet" href="/blog/blog.css">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
<body>
<div class="blog-page">
  <a class="blog-back" href="/">← back to portfolio</a>
  <article class="blog-post">
    <h1>${escapeHtml(post.title)}</h1>
    <p class="blog-date">${escapeHtml(post.dateDisplay)}</p>
    <div class="blog-body">${post.html}</div>
  </article>
</div>
</body>
</html>
`
}

export function renderIndexHtml(posts) {
  const items = posts.map(p => `
    <li class="blog-index-item">
      <a href="/blog/${escapeHtml(p.slug)}/">
        <h2>${escapeHtml(p.title)}</h2>
        <p class="blog-date">${escapeHtml(p.dateDisplay)}</p>
        <p class="blog-tldr">${escapeHtml(p.tldr)}</p>
      </a>
    </li>`).join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${headMeta({ title: 'Blog', description: 'Notes from building MDFLD, Square A, and machine learning for football, written as I go.', path: '/blog/', type: 'website' })}
<link rel="stylesheet" href="/blog/blog.css">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
<body>
<div class="blog-page">
  <a class="blog-back" href="/">← back to portfolio</a>
  <h1>Blog</h1>
  <ul class="blog-index-list">${items}</ul>
</div>
</body>
</html>
`
}
