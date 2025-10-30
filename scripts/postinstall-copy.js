// Postinstall helper to copy the packaged pdfjs assets into the host app's public folder
// This aims to make the default fallback URL (/pdfjs/web/viewer.html) work out of the box.
// It is best-effort: if no conventional public folder is found, we do nothing and print a hint.

import { cp, mkdir, stat } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function exists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function main() {
  const pkgRoot = resolve(__dirname, '..')
  const assetsSrc = resolve(pkgRoot, 'assets', 'pdfjs')

  // Detect a host app root by walking up from node_modules/<pkg>
  // Typical structures this will support:
  // - <app>/public
  // - <app>/.vitepress/public (less common here)
  // - <app>/static or <app>/assets (fallback)
  let hostRoot = resolve(pkgRoot, '..') // node_modules/vue3-pdf-viewer-component -> node_modules
  hostRoot = resolve(hostRoot, '..') // -> <app>

  const candidates = [
    resolve(hostRoot, 'public', 'pdfjs'),
    resolve(hostRoot, 'static', 'pdfjs'),
  ]

  let target = null
  // Prefer existing src/public or public dir, otherwise create public/pdfjs
  if (await exists(resolve(hostRoot, 'src', 'public'))) {
    target = resolve(hostRoot, 'src', 'public', 'pdfjs')
  } else if (await exists(resolve(hostRoot, 'public'))) {
    target = resolve(hostRoot, 'public', 'pdfjs')
  } else if (await exists(resolve(hostRoot, 'src', 'static'))) {
    target = resolve(hostRoot, 'src', 'static', 'pdfjs')
  } else if (await exists(resolve(hostRoot, 'static'))) {
    target = resolve(hostRoot, 'static', 'pdfjs')
  } else {
    // As a last resort, use public/pdfjs and create it
    target = resolve(hostRoot, 'public', 'pdfjs')
  }

  await mkdir(target, { recursive: true })
  await cp(assetsSrc, target, { recursive: true })
  const rel = target.replace(hostRoot + '\\', '').replace(hostRoot + '/', '')
  console.log(`[vue3-pdf-viewer-component] Copied pdfjs assets to ${rel}`)
}

main().catch((err) => {
  // Swallow errors to avoid breaking consumer installs
  console.warn('[vue3-pdf-viewer-component] postinstall copy skipped:', err?.message || err)
})
