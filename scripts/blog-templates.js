// scripts/blog-templates.js
import { escapeHtml } from '../src/utils/escape-html.js'

export function renderPostHtml(post) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(post.title)} — Ayoola Morakinyo</title>
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
<title>Blog — Ayoola Morakinyo</title>
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
