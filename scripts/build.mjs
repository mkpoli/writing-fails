import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const site = 'https://writing-fails.mkpo.li'
const brand = 'Writing fails'
const submitUrl = 'https://github.com/mkpoli/writing-fails/issues/new?template=example.yml'

const locales = [
  { code: 'en', path: '', label: 'EN', ogLocale: 'en_US' },
  { code: 'ja', path: 'ja/', label: '日本語', ogLocale: 'ja_JP' },
  { code: 'zh-Hans', path: 'zh/', label: '中文', ogLocale: 'zh_CN' },
  { code: 'ko', path: 'ko/', label: '한국어', ogLocale: 'ko_KR' },
]

const kindKeys = ['direction', 'layout', 'flipped', 'lookalike', 'typo', 'wording', 'unfamiliar', 'translation', 'damage']
const langOrder = ['korean', 'chinese', 'japanese', 'english', 'french', 'spanish', 'german', 'italian', 'portuguese', 'other']

const entries = JSON.parse(readFileSync(join(root, 'content/entries.json'), 'utf8'))
const langKeys = langOrder.filter(key => entries.some(entry => entry.language === key))
const catalogs = Object.fromEntries(locales.map(locale => [
  locale.code,
  JSON.parse(readFileSync(join(root, `locales/${locale.code}.json`), 'utf8')),
]))

const t = (locale, key) => {
  const value = key.split('.').reduce((node, part) => node?.[part], catalogs[locale])
  if (typeof value !== 'string') throw new Error(`Missing message ${locale}:${key}`)
  return value
}

const esc = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const format = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`)

// The intended and misread strings are often in the sign's own language, not
// the page language. Declaring it lets the browser pick the right CJK face.
const sampleLang = (value, entry) => {
  if (/\p{Script=Hangul}/u.test(value)) return 'ko'
  if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(value)) return 'ja'
  if (!/\p{Script=Han}/u.test(value)) return ''
  if (['zh-Hans', 'zh-Hant', 'ja', 'ko'].includes(entry.titleLang)) return entry.titleLang
  if (entry.language === 'chinese') return 'zh-Hans'
  if (entry.language === 'korean') return 'ko'
  return 'ja'
}

const langAttr = (value, field, entry, code) => {
  // Direction labels are translated per page; anything unchanged from English
  // is the quoted sign text and can be in another language.
  const lang = value === t('en', `entries.${entry.id}.${field}`)
    ? sampleLang(value, entry)
    : code
  return lang ? ` lang="${lang}"` : ''
}

const ids = new Set()
for (const [index, entry] of entries.entries()) {
  if (ids.has(entry.id)) throw new Error(`Duplicate entry id: ${entry.id}`)
  if (entry.number !== index + 1) throw new Error(`Entry ${entry.id} is out of order`)
  if (!kindKeys.includes(entry.kind)) throw new Error(`Unknown kind on ${entry.id}: ${entry.kind}`)
  if (!langOrder.includes(entry.language)) throw new Error(`Unknown language on ${entry.id}: ${entry.language}`)
  ids.add(entry.id)
}

function langLinks(locale, prefix) {
  return locales.map(target => {
    const current = target.code === locale.code
    const href = current ? './' : `${prefix}${target.path}`
    return `<a href="${esc(href)}" hreflang="${target.code}" lang="${target.code}"${current ? ' aria-current="page"' : ''}>${esc(target.label)}</a>`
  }).join('')
}

function head(locale, prefix) {
  const alternates = locales.map(target =>
    `<link rel="alternate" hreflang="${target.code}" href="${site}/${target.path}">`).join('\n')
  const ogAlternates = locales
    .filter(target => target.code !== locale.code)
    .map(target => `<meta property="og:locale:alternate" content="${target.ogLocale}">`)
    .join('\n')

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t(locale.code, 'meta.title'))}</title>
<meta name="description" content="${esc(t(locale.code, 'meta.description'))}">
<link rel="canonical" href="${site}/${locale.path}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${site}/">
<link rel="icon" href="${prefix}favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${prefix}assets/apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="./site.webmanifest">
<meta name="theme-color" content="#f7f6f4">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(t(locale.code, 'meta.title'))}">
<meta property="og:description" content="${esc(t(locale.code, 'meta.description'))}">
<meta property="og:url" content="${site}/${locale.path}">
<meta property="og:locale" content="${locale.ogLocale}">
${ogAlternates}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefix}style.css">`
}

function card(entry, locale) {
  const code = locale.code
  const tags = [entry.language, entry.kind]
  const tagsHtml = tags
    .map(tag => `<span>${esc(t(code, `tags.${tag}`))}</span>`)
    .join('')
  const creditParts = entry.credit.label.split(' VIA ')
  const creditLabel = creditParts.length === 2
    ? format(esc(t(code, 'credits.via')), { a: esc(creditParts[0]), b: esc(creditParts[1]) })
    : esc(entry.credit.label)
  const creditName = entry.credit.href
    ? `<a href="${esc(entry.credit.href)}">${creditLabel} ↗</a>`
    : creditLabel
  const credit = format(esc(t(code, `credits.${entry.credit.role}`)), {
    name: creditName,
  })
  const reading = entry.reading
    ? `<a href="${esc(entry.reading)}">${esc(t(code, 'reading'))} ↗</a>`
    : ''
  const imageInner = `<img src="${localePrefix(code)}${esc(entry.image.src)}" alt="${esc(t(code, `entries.${entry.id}.alt`))}" loading="lazy"><span class="image-index">${String(entry.number).padStart(2, '0')} / ${esc(t(code, `types.${entry.type}`))}</span>`
  const image = entry.image.href
    ? `<a class="card-image" href="${esc(entry.image.href)}">${imageInner}<span class="image-link">↗</span></a>`
    : `<div class="card-image">${imageInner}</div>`
  const intended = t(code, `entries.${entry.id}.intended`)
  const misread = t(code, `entries.${entry.id}.misread`)

  return `<article class="card" data-lang="${entry.language}" data-kind="${entry.kind}" data-keywords="${esc(entry.keywords)}">
${image}
<div class="card-content">
<div class="tags">${tagsHtml}</div>
<h3 lang="${entry.titleLang}">${esc(entry.title)}</h3>
<div class="direction"><span class="dir"><span>${esc(t(code, 'labels.intended'))}</span><b${langAttr(intended, 'intended', entry, code)}>${esc(intended)}</b></span><span class="dir-arrow">→</span><span class="dir"><span>${esc(t(code, 'labels.misread'))}</span><b${langAttr(misread, 'misread', entry, code)}>${esc(misread)}</b></span></div>
<p>${esc(t(code, `entries.${entry.id}.description`))}</p>
<div class="card-footer"><span>${credit}</span>${reading}</div>
</div>
</article>`
}

function localePrefix(code) {
  return code === 'en' ? '' : '../'
}

function page(locale) {
  const prefix = localePrefix(locale.code)
  const code = locale.code
  const kindCounts = Object.fromEntries(kindKeys.map(key => [
    key,
    entries.filter(entry => entry.kind === key).length,
  ]))
  const kindFilters = [
    `<button class="active" aria-pressed="true" data-facet="all" data-filter="all">${esc(t(code, 'filters.all')).replace('{count}', `<span>${entries.length}</span>`)}</button>`,
    ...kindKeys.map(key => `<button aria-pressed="false" data-facet="kind" data-filter="${key}">${esc(t(code, `filters.${key}`))}<span>${kindCounts[key]}</span></button>`),
  ].join('')
  const langFilters = [
    `<span class="filter-label">${esc(t(code, 'filters.langLabel'))}</span>`,
    ...langKeys.map(key => `<button aria-pressed="false" data-facet="lang" data-filter="${key}">${esc(t(code, `filters.${key}`))}</button>`),
  ].join('')

  return `<!doctype html>
<html lang="${code}">
<head>
${head(locale, prefix)}
</head>
<body>
<header class="topbar">
<a class="brand" href="#top"><span class="brandmark">文<span>↘</span></span><span>writing<br><b>fails.</b></span></a>
<div class="topbar-right">
<nav class="langs" aria-label="${esc(t(code, 'langs.label'))}">${langLinks(locale, prefix)}</nav>
<nav class="nav" aria-label="${esc(t(code, 'nav.label'))}"><a href="#collection">${esc(t(code, 'nav.collection'))}</a><a class="submit" href="${submitUrl}">${esc(t(code, 'nav.submit'))} <span>↗</span></a></nav>
</div>
</header>
<main id="top">
<section id="collection" class="collection">
<div class="section-heading"><div><h1>${brand}</h1><p>${esc(t(code, 'hero.tagline'))}</p></div></div>
<div class="toolbar">
<div class="filters" role="group" aria-label="${esc(t(code, 'filters.label'))}">${kindFilters}</div>
<div class="toolbar-end">
<div class="filters filters-lang" role="group" aria-label="${esc(t(code, 'filters.langLabel'))}">${langFilters}</div>
<label class="search"><span>⌕</span><input id="search" type="search" placeholder="${esc(t(code, 'search.placeholder'))}" aria-label="${esc(t(code, 'search.label'))}"><span class="search-key">/</span></label>
</div>
</div>
<div class="cards">
${entries.map(entry => card(entry, locale)).join('\n')}
</div>
<p class="empty" hidden>${esc(t(code, 'empty'))}</p>
</section>
</main>
<footer><span>${format(esc(t(code, 'footer.license')), { cc0: '<a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>' })}</span><a class="footer-brand" href="#top">writing <b>fails.</b></a><span></span><a href="#top">${esc(t(code, 'footer.backToTop'))}</a></footer>
<script src="${prefix}script.js"></script>
</body>
</html>
`
}

function webManifest(locale) {
  return `${JSON.stringify({
    id: '/',
    name: t(locale.code, 'meta.title'),
    short_name: brand,
    description: t(locale.code, 'meta.description'),
    lang: locale.code,
    start_url: `/${locale.path}`,
    scope: '/',
    display: 'standalone',
    background_color: '#f7f6f4',
    theme_color: '#f7f6f4',
    icons: [
      { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/assets/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2)}\n`
}

for (const locale of locales) {
  const dir = join(root, locale.path)
  mkdirSync(dir, { recursive: true })

  writeFileSync(join(dir, 'index.html'), page(locale))
  console.log(`wrote ${locale.path || './'}index.html`)

  writeFileSync(join(dir, 'site.webmanifest'), webManifest(locale))
  console.log(`wrote ${locale.path || './'}site.webmanifest`)
}
