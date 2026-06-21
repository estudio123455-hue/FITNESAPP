// Runs after `vite build` (wired as the `postbuild` npm script).
// Lists every emitted file so the service worker can precache exactly this
// build's assets, and stamps sw.js with a version hash derived from the
// actual file contents — so the cache name (and therefore the old-cache
// cleanup in sw.js's `activate` handler) changes whenever any shipped file
// changes, even unhashed ones like index.html or manifest.json.
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const distDir = path.join(__dirname, '..', 'dist')
const SKIP = new Set(['sw.js', 'asset-manifest.json'])

function walk(dir, base = '') {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = path.join(base, entry.name)
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(fullPath, relPath))
    } else if (!SKIP.has(entry.name)) {
      files.push({ url: '/' + relPath.split(path.sep).join('/'), fullPath })
    }
  }
  return files
}

const files = walk(distDir).sort((a, b) => a.url.localeCompare(b.url))
const urls = files.map((f) => f.url)
fs.writeFileSync(path.join(distDir, 'asset-manifest.json'), JSON.stringify(urls))

const hash = crypto.createHash('sha1')
for (const file of files) {
  hash.update(file.url)
  hash.update(fs.readFileSync(file.fullPath))
}
const version = hash.digest('hex').slice(0, 10)

const swPath = path.join(distDir, 'sw.js')
const swSource = fs.readFileSync(swPath, 'utf8')
fs.writeFileSync(swPath, swSource.replaceAll('__CACHE_VERSION__', version))

console.log(`asset-manifest.json: ${urls.length} files, sw cache version ${version}`)
