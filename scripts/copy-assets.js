// Simple Node script to copy the pdfjs assets into dist so runtime URLs work
// Works on Node 16+ (fs.cp with recursive)
import { cp, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  const root = resolve(__dirname, '..')
  const from = resolve(root, 'assets', 'pdfjs')
  const to = resolve(root, 'dist', 'assets', 'pdfjs')
  await mkdir(resolve(root, 'dist', 'assets'), { recursive: true })
  await cp(from, to, { recursive: true })
  console.log(`[copy-assets] Copied ${from} -> ${to}`)
}

main().catch((err) => {
  console.error('[copy-assets] Failed:', err)
  process.exit(1)
})
