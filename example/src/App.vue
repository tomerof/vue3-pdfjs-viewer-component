<script setup lang="ts">
import { ref } from 'vue'
import PdfViewerComponent from 'vue3-pdf-viewer-component'

const pdfRef = ref<InstanceType<typeof PdfViewerComponent> | null>(null)
const sampleUrl = ref('https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf')
const page = ref<number | undefined>(undefined)

function openSample() {
  pdfRef.value?.setPdfSrc(sampleUrl.value)
  pdfRef.value?.refresh()
}

function goTo(n: number) {
  page.value = n
}
</script>

<template>
  <div class="wrap">
    <h1>vue3-pdf-viewer-component — Example</h1>

    <p>
      This demo loads a public sample PDF. Click "Open PDF" to inject the URL
      into the viewer and render it inside the iframe.
    </p>

    <div style="margin-bottom: 8px;">
      <input style="width: 520px" v-model="sampleUrl" placeholder="Enter a PDF URL" />
      <button @click="openSample">Open PDF</button>
      <button @click="() => pdfRef?.refresh()">Refresh</button>
      <button @click="() => goTo(1)">Go to page 1</button>
      <button @click="() => goTo(2)">Go to page 2</button>
      <button @click="() => goTo(3)">Go to page 3</button>
    </div>

    <div class="viewer">
      <PdfViewerComponent
        ref="pdfRef"
        :viewer-id="'example'"
        :pdf-src="null"
        :page="page"
        :open-file="true"
        :download="false"
        :print="false"
        viewer-folder="/pdfjs"
        @on-before-print="() => console.log('before print')"
        @on-after-print="() => console.log('after print')"
        @on-document-load="(e) => console.log('pages loaded', e)"
        @on-page-change="(e) => console.log('page change', e)"
      />
    </div>

    <p>
      Tip: You can also set <code>externalWindow</code> to open the PDF viewer in
      a separate tab/window.
    </p>
  </div>
</template>

<style scoped>
.viewer {
  height: 80vh;
  border: 1px solid #ddd;
}
</style>
