<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

// Ensure bundlers include the entire PDF.js viewer folder when packaging this component.
// Vite supports import.meta.glob; for other bundlers this is a no-op.
try {
  (import.meta as any).glob?.('../assets/pdfjs/**', { eager: true, as: 'url' })
} catch {}

// Props mirroring Angular inputs
const props = defineProps<{
  viewerId?: string
  viewerFolder?: string
  externalWindow?: boolean
  showSpinner?: boolean
  downloadFileName?: string
  openFile?: boolean
  download?: boolean
  startDownload?: boolean
  viewBookmark?: boolean
  print?: boolean
  startPrint?: boolean
  fullScreen?: boolean
  find?: boolean
  zoom?: string
  nameddest?: string
  pagemode?: string
  lastPage?: boolean
  rotatecw?: boolean
  rotateccw?: boolean
  cursor?: string
  scroll?: string
  spread?: string
  locale?: string
  useOnlyCssZoom?: boolean
  errorOverride?: boolean
  errorAppend?: boolean
  errorMessage?: string
  diagnosticLogs?: boolean
  externalWindowOptions?: string
  page?: number
  pdfSrc?: string | Blob | Uint8Array | null
}>()

// Defaults (matching Angular constructor)
const externalWindow = ref(props.externalWindow ?? false)
const showSpinner = ref(props.showSpinner ?? true)
const openFile = ref(props.openFile ?? true)
const download = ref(props.download ?? true)
const viewBookmark = ref(props.viewBookmark ?? true)
const print = ref(props.print ?? true)
const fullScreen = ref(props.fullScreen ?? true)
const find = ref(props.find ?? true)
const useOnlyCssZoom = ref(props.useOnlyCssZoom ?? false)
const errorOverride = ref(props.errorOverride ?? false)
const errorAppend = ref(props.errorAppend ?? true)
const diagnosticLogs = ref(props.diagnosticLogs ?? true)

// Emits mirroring Angular outputs (with kebab-case aliases for convenience)
const emit = defineEmits<{
  (e: 'onBeforePrint'): void
  (e: 'onAfterPrint'): void
  (e: 'onDocumentLoad', payload: any): void
  (e: 'onPageChange', payload: any): void
  (e: 'before-print'): void
  (e: 'after-print'): void
  (e: 'document-load', payload: any): void
  (e: 'page-change', payload: any): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
let viewerTab: Window | null = null
const hasSrc = ref(!!(typeof window !== 'undefined' ? (typeof props.pdfSrc !== 'undefined' && props.pdfSrc !== null) : false))

function getPDFViewerApplicationOptions(): any | null {
  if (externalWindow.value) {
    return viewerTab ? (viewerTab as any).PDFViewerApplicationOptions : null
  } else {
    return iframeRef.value?.contentWindow ? (iframeRef.value.contentWindow as any).PDFViewerApplicationOptions : null
  }
}

function getPDFViewerApplication(): any | null {
  if (externalWindow.value) {
    return viewerTab ? (viewerTab as any).PDFViewerApplication : null
  } else {
    return iframeRef.value?.contentWindow ? (iframeRef.value.contentWindow as any).PDFViewerApplication : null
  }
}

function receiveMessage(event: MessageEvent) {
  const data: any = (event as any).data
  if (data && data.viewerId && data.event) {
    const viewerId = data.viewerId
    const evt = data.event
    const param = data.param
    if (props.viewerId === viewerId) {
      if (evt === 'beforePrint') {
        emit('onBeforePrint'); emit('before-print')
      } else if (evt === 'afterPrint') {
        emit('onAfterPrint'); emit('after-print')
      } else if (evt === 'pagesLoaded') {
        emit('onDocumentLoad', param); emit('document-load', param)
      } else if (evt === 'pageChange') {
        emit('onPageChange', param); emit('page-change', param)
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('message', receiveMessage, false)
  if (!externalWindow.value) {
    loadPdf()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', receiveMessage, false)
})

function refresh() {
  loadPdf()
}

function setPdfSrc(src: string | Blob | Uint8Array | null | undefined) {
  _src = src as any
  hasSrc.value = _src != null
}
function getPdfSrc(): string | Blob | Uint8Array | null | undefined {
  return _src
}

function setPage(p: number | undefined) {
  _page = p
  const app = getPDFViewerApplication()
  if (app) {
    try {
      app.page = _page
    } catch (e) {
      if (diagnosticLogs.value) console.warn('Unable to set page on PDFViewerApplication', e)
    }
  } else {
    if (diagnosticLogs.value) console.warn("Document is not loaded yet!!!. Try to set page# after full load.")
  }
}
function getPage(): number | undefined {
  const app = getPDFViewerApplication()
  if (app) return app.page as number
  if (diagnosticLogs.value) console.warn('Document is not loaded yet!!!. Try to retrieve page# after full load.')
  return undefined
}

let _src: string | Blob | Uint8Array | null | undefined = props.pdfSrc
let _page: number | undefined = props.page

watch(() => props.page, (n) => {
  if (typeof n === 'number') setPage(n)
})

watch(() => props.pdfSrc, (n) => {
  _src = n as any
  hasSrc.value = _src != null
  // Note: per Angular parity, changing pdfSrc does not auto-reload; call refresh() to apply.
})

function buildViewerUrl(): string | null {
  if (!_src) return null
  let fileUrl: string
  if (typeof Blob !== 'undefined' && _src instanceof Blob) {
    fileUrl = encodeURIComponent(URL.createObjectURL(_src))
  } else if (typeof Uint8Array !== 'undefined' && _src instanceof Uint8Array) {
    // Create a true ArrayBuffer to satisfy BlobPart typing (avoids SharedArrayBuffer/ArrayBufferLike issues)
    const ab = new ArrayBuffer(_src.byteLength)
    new Uint8Array(ab).set(_src)
    const blob = new Blob([ab], { type: 'application/pdf' })
    fileUrl = encodeURIComponent(URL.createObjectURL(blob))
  } else if (typeof _src === 'string') {
    fileUrl = _src
  } else {
    return null
  }

  function resolveDefaultViewerHtml(): string {
    // Try to let the bundler give us a real URL (preferred for Vite/Rollup)
    // First, force file emission with the `?url` suffix (Vite/Rollup convention)
    try {
      const forced = new URL('../assets/pdfjs/web/viewer.html?url', import.meta.url).toString()
      if (!forced.startsWith('data:')) return forced
    } catch {}
    // Then try without the suffix (works in some setups)
    try {
      const resolved = new URL('../assets/pdfjs/web/viewer.html', import.meta.url).toString()
      // Some bundlers inline small assets into data URLs. PDF.js viewer cannot be a data URL
      // because it loads other relative assets (JS/CSS) which would fail to resolve from data:.
      if (!resolved.startsWith('data:')) return resolved
    } catch {}
    // Fallbacks:
    // 1) Allow host app to provide a base folder globally (before Vue app mounts):
    //    window.__PDFJS_VIEWER_BASE_URL__ = '/some/public/path/to/pdfjs'
    const globalBase = (typeof window !== 'undefined' && (window as any).__PDFJS_VIEWER_BASE_URL__)
    if (globalBase) return `${globalBase.replace(/\/$/, '')}/web/viewer.html`
    // 2) Default to `/assets/pdfjs/web/viewer.html` assuming assets are served from /assets
    return '/assets/pdfjs/web/viewer.html'
  }
  const defaultViewerHtml = resolveDefaultViewerHtml()
  let viewerUrl = props.viewerFolder ? `${props.viewerFolder}/web/viewer.html` : defaultViewerHtml
  viewerUrl += `?file=${fileUrl}`

  if (props.viewerId !== undefined) viewerUrl += `&viewerId=${props.viewerId}`
  // Signal supported events (parity with Angular building query flags)
  viewerUrl += `&beforePrint=true&afterPrint=true&pagesLoaded=true&pageChange=true`
  if (props.downloadFileName) {
    const name = props.downloadFileName.endsWith('.pdf') ? props.downloadFileName : `${props.downloadFileName}.pdf`
    viewerUrl += `&fileName=${name}`
  }
  if (props.openFile !== undefined) viewerUrl += `&openFile=${openFile.value}`
  if (props.download !== undefined) viewerUrl += `&download=${download.value}`
  if (props.startDownload) viewerUrl += `&startDownload=${props.startDownload}`
  if (props.viewBookmark !== undefined) viewerUrl += `&viewBookmark=${viewBookmark.value}`
  if (props.print !== undefined) viewerUrl += `&print=${print.value}`
  if (props.startPrint) viewerUrl += `&startPrint=${props.startPrint}`
  if (props.fullScreen !== undefined) viewerUrl += `&fullScreen=${fullScreen.value}`
  if (props.find !== undefined) viewerUrl += `&find=${find.value}`
  if (props.lastPage) viewerUrl += `&lastpage=${props.lastPage}`
  if (props.rotatecw) viewerUrl += `&rotatecw=${props.rotatecw}`
  if (props.rotateccw) viewerUrl += `&rotateccw=${props.rotateccw}`
  if (props.cursor) viewerUrl += `&cursor=${props.cursor}`
  if (props.scroll) viewerUrl += `&scroll=${props.scroll}`
  if (props.spread) viewerUrl += `&spread=${props.spread}`
  if (props.locale) viewerUrl += `&locale=${props.locale}`
  if (props.useOnlyCssZoom) viewerUrl += `&useOnlyCssZoom=${useOnlyCssZoom.value}`

  if (_page || props.zoom || props.nameddest || props.pagemode) viewerUrl += '#'
  if (_page) viewerUrl += `&page=${_page}`
  if (props.zoom) viewerUrl += `&zoom=${props.zoom}`
  if (props.nameddest) viewerUrl += `&nameddest=${props.nameddest}`
  if (props.pagemode) viewerUrl += `&pagemode=${props.pagemode}`

  if (props.errorOverride || props.errorAppend) {
    if (props.errorMessage) viewerUrl += `&errorMessage=${props.errorMessage}`
    if (props.errorOverride) viewerUrl += `&errorOverride=${errorOverride.value}`
    if (props.errorAppend) viewerUrl += `&errorAppend=${errorAppend.value}`
  }

  return viewerUrl
}

function loadPdf() {
  const viewerUrl = buildViewerUrl()
  if (!viewerUrl) return

  if (externalWindow.value && (!viewerTab || viewerTab.closed)) {
    viewerTab = window.open('', '_blank', props.externalWindowOptions || '')
    if (viewerTab == null) {
      if (diagnosticLogs.value) console.error("ng2-pdfjs-viewer: For 'externalWindow = true'. i.e opening in new tab to work, pop-ups should be enabled.")
      return
    }
    if (showSpinner.value) {
      viewerTab.document.write(`
          <style>
          .loader { position: fixed; left: 40%; top: 40%; border: 16px solid #f3f3f3; border-radius: 50%; border-top: 16px solid #3498db; width: 120px; height: 120px; animation: spin 2s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
          </style>
          <div class="loader"></div>
        `)
    }
  }

  if (externalWindow.value) {
    if (viewerTab) viewerTab.location.href = viewerUrl
  } else {
    if (iframeRef.value) iframeRef.value.src = viewerUrl
  }
}

// Expose public API
defineExpose({
  refresh,
  setPage,
  getPage,
  getPDFViewerApplication,
  getPDFViewerApplicationOptions,
  setPdfSrc,
  getPdfSrc,
})
</script>

<template>
  <iframe
    ref="iframeRef"
    title="ng2-pdfjs-viewer"
    width="100%"
    height="100%"
    v-show="!externalWindow && hasSrc"
  ></iframe>
</template>

<style scoped>
iframe {
  border: none;
}
</style>