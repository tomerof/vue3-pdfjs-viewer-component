# Vue 3 PDF.js Viewer (Composition API + TypeScript)

This is a Vue 3 Composition API + TypeScript port of the Angular `ng2-pdfjs-viewer` component. It mirrors the public API and behavior of the Angular component while providing a Vue-friendly interface.

Notes:
- Standalone: The PDF.js viewer and all required assets are vendored into this package under `assets/pdfjs`. No external setup is required.
- Default viewer URL is resolved from the package itself using `new URL('../assets/pdfjs/web/viewer.html', import.meta.url)`.
- You can still override via the `viewerFolder` prop if you want to host your own copy of the viewer (must point at a folder that contains `web/viewer.html`).
- Supports rendering in an embedded iframe or in a new external window/tab (`externalWindow = true`).
- Listens to messages from the PDF.js viewer and emits the same events: `onBeforePrint`, `onAfterPrint`, `onDocumentLoad`, `onPageChange`.
- Methods are exposed via `ref` using `defineExpose` for parity: `refresh()`, `setPage(n)`, `getPage()`, `getPDFViewerApplication()`, `getPDFViewerApplicationOptions()`, `setPdfSrc(src)`, `getPdfSrc()`.
- For parity with Angular, changing `pdfSrc` does not automatically reload; call `refresh()` to reload after updating `pdfSrc`.

Usage example:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import PdfJsViewer from 'vue3-pdf-viewer-component'

const pdfRef = ref<InstanceType<typeof PdfJsViewer> | null>(null)

function openPdf() {
  pdfRef.value?.setPdfSrc('/assets/sample.pdf')
  pdfRef.value?.refresh()
}
</script>

<template>
  <div style="height: 80vh;">
    <PdfJsViewer
      ref="pdfRef"
      :viewer-id="'main'"
      :pdf-src="null"
      :open-file="true"
      :download="true"
      :print="true"
      @on-before-print="() => console.log('before print')"
      @on-after-print="() => console.log('after print')"
      @on-document-load="(e) => console.log('pages loaded', e)"
      @on-page-change="(e) => console.log('page change', e)"
    />
    <button @click="openPdf">Open PDF</button>
  </div>
</template>
```

How dependencies are loaded
- The PDF.js viewer assets are included in this package under `assets/pdfjs`.
- The component resolves the viewer URL at runtime with `new URL('../assets/pdfjs/web/viewer.html', import.meta.url)` so you don't need to copy anything into your app.
- For Vite and similar bundlers, we also reference all files under `assets/pdfjs/**` so they are copied to the final build output.
- If your bundler does not support `import.meta.url` asset URLs, set the `viewerFolder` prop to a publicly served path where you host the `pdfjs` folder (e.g. place `assets/pdfjs` into your app's `public/` and use `viewerFolder="/assets/pdfjs"`).

Try the example locally
- We include a Vite example under `example/`.
- Run the example dev server from the project root:
  - `npm install`
  - `npm run dev:example`
- The example aliases the package to the local source so you can develop interactively.

Build the library
- `npm run build` — produces ESM output in `dist/` and TypeScript declarations, and copies the `assets/pdfjs` folder for runtime usage.
- `npm run typecheck` — type-checks the source.

Publish to npm
- Set the desired package name and version in `package.json`.
- Ensure you are logged in: `npm login`.
- Build and publish: `npm run build && npm publish --access public`.
- Consumers can then `npm i vue3-pdf-viewer-component` and `import PdfJsViewer from 'vue3-pdf-viewer-component'`.

Props mirror the Angular inputs:
- viewerId, viewerFolder, externalWindow, showSpinner, downloadFileName, openFile, download, startDownload, viewBookmark, print, startPrint, fullScreen, find, zoom, nameddest, pagemode, lastPage, rotatecw, rotateccw, cursor, scroll, spread, locale, useOnlyCssZoom, errorOverride, errorAppend, errorMessage, diagnosticLogs, externalWindowOptions, page, pdfSrc.

Events mirror the Angular outputs:
- onBeforePrint, onAfterPrint, onDocumentLoad, onPageChange.

Additionally, kebab-case aliases are emitted too for convenience:
- before-print, after-print, document-load, page-change.
