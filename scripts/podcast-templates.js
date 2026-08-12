// scripts/podcast-templates.js
import { escapeHtml } from '../src/utils/escape-html.js'

export function renderEpisodeHtml(episode) {
  const audioMarkup = episode.hasAudio
    ? `<audio class="podcast-audio" controls src="/podcast/audio/${escapeHtml(episode.audio)}"></audio>`
    : `<p class="podcast-pending">Recording not yet published.</p>`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(episode.title)} — Ayoola Morakinyo</title>
<link rel="stylesheet" href="/blog/blog.css">
<link rel="stylesheet" href="/podcast/podcast.css">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
<body>
<div class="blog-page">
  <a class="blog-back" href="/">← back to portfolio</a>
  <article class="blog-post">
    <h1>${escapeHtml(episode.title)}</h1>
    <p class="blog-date">${escapeHtml(episode.dateDisplay)}</p>
    ${audioMarkup}
    <div class="blog-body">${episode.html}</div>
  </article>
</div>
</body>
</html>
`
}

export function renderIndexHtml(episodes) {
  const items = episodes.map(e => `
    <li class="blog-index-item">
      <a href="/podcast/${escapeHtml(e.slug)}/">
        <h2>${escapeHtml(e.title)}</h2>
        <p class="blog-date">${escapeHtml(e.dateDisplay)}</p>
        <p class="blog-tldr">${escapeHtml(e.tldr)}</p>
      </a>
    </li>`).join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Podcast — Ayoola Morakinyo</title>
<link rel="stylesheet" href="/blog/blog.css">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
<body>
<div class="blog-page">
  <a class="blog-back" href="/">← back to portfolio</a>
  <h1>Podcast</h1>
  <ul class="blog-index-list">${items}</ul>
</div>
</body>
</html>
`
}
