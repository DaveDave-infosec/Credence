// Credence — file text extraction (lazy-loaded)
// PDFs: try text layer first, fall back to OCR for scanned PDFs.
// Images: tesseract.js OCR. TXT: read directly.

type ProgressCallback = (pct: number, phase?: string) => void

async function loadPdfjs(): Promise<any> {
  const pdfjs: any = await import("pdfjs-dist")
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  }
  return pdfjs
}

async function readPdfTextLayer(pdf: any, onProgress?: ProgressCallback): Promise<string> {
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    if (onProgress) {
      onProgress((i / pdf.numPages) * 30, "Reading PDF text layer")
    }
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item: any) => (item && typeof item.str === "string" ? item.str : ""))
      .join(" ")
    pages.push(text)
  }
  return pages.join("\n\n").replace(/[ \t]+/g, " ").trim()
}

async function ocrPdfPages(pdf: any, onProgress?: ProgressCallback): Promise<string> {
  const { createWorker } = await import("tesseract.js")
  if (onProgress) onProgress(35, "Loading OCR engine for scanned PDF")
  const worker = await createWorker("eng")

  try {
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const pageStart = 40 + ((i - 1) / pdf.numPages) * 55
      const pageEnd = 40 + (i / pdf.numPages) * 55

      if (onProgress) {
        onProgress(
          pageStart,
          pdf.numPages > 1
            ? `Scanning page ${i} of ${pdf.numPages}`
            : "Scanning page (this is slower than text extraction)",
        )
      }

      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement("canvas")
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Canvas rendering unavailable in this browser.")
      }
      await page.render({ canvasContext: ctx, viewport }).promise

      const { data } = await worker.recognize(canvas)
      pages.push((data?.text || "").trim())

      // Release canvas memory between pages
      canvas.width = 0
      canvas.height = 0

      if (onProgress) onProgress(pageEnd, undefined)
    }

    return pages.join("\n\n").trim()
  } finally {
    await worker.terminate()
  }
}

export async function extractPdfText(
  file: File,
  onProgress?: ProgressCallback,
): Promise<string> {
  const pdfjs = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  // First pass — extract any embedded text layer.
  const layerText = await readPdfTextLayer(pdf, onProgress)

  // If the text layer is substantive, use it.
  if (layerText.replace(/\s+/g, "").length >= 20) {
    if (onProgress) onProgress(100, "Done")
    return layerText
  }

  // Otherwise it's a scanned PDF — render each page & OCR.
  const ocrText = await ocrPdfPages(pdf, onProgress)

  if (!ocrText) {
    throw new Error(
      "PDF appears to be empty or unreadable. Try re-scanning at higher resolution.",
    )
  }

  if (onProgress) onProgress(100, "Done")
  return ocrText
}

export async function extractImageText(
  file: File,
  onProgress?: ProgressCallback,
): Promise<string> {
  const { createWorker } = await import("tesseract.js")
  if (onProgress) onProgress(5, "Loading OCR engine")
  const worker = await createWorker("eng", undefined, {
    logger: (m: any) => {
      if (
        m?.status === "recognizing text" &&
        typeof m?.progress === "number" &&
        onProgress
      ) {
        onProgress(20 + m.progress * 75, "Scanning image")
      }
    },
  })

  try {
    const { data } = await worker.recognize(file)
    if (onProgress) onProgress(100, "Done")
    return (data?.text || "").trim()
  } finally {
    await worker.terminate()
  }
}

export async function extractPlainText(file: File): Promise<string> {
  const text = await file.text()
  return text.trim()
}

/**
 * Strip predictable OCR junk from extracted text.
 * Targets scanner-frame noise & artifacts, NOT genuine content —
 * deliberately conservative so it never eats real credential text.
 */
function autoClean(raw: string): string {
  const lines = raw.split(/\r?\n/)

  const cleaned = lines
    .map((line) => line.trim())
    .filter((line) => {
      if (line === "") return true // preserve paragraph breaks
      // Drop a leaked progress indicator like "0%" or "42%"
      if (/^\d{1,3}%$/.test(line)) return false
      // Drop lines that are only scanner-frame punctuation / brackets
      if (/^[\[\]\|\}\{=_~`^*•·]+$/.test(line)) return false
      // Drop isolated single characters (stray "J", "a", "[" from frame edges)
      if (/^[A-Za-z\[\]\|]$/.test(line)) return false
      return true
    })
    .join("\n")

  // Collapse 3+ consecutive blank lines into a single break
  return cleaned.replace(/\n{3,}/g, "\n\n").trim()
}

export type ExtractResult = {
  text: string
  originalLength: number
  truncated: boolean
}

export async function extractFile(
  file: File,
  maxChars: number,
  onProgress?: ProgressCallback,
): Promise<ExtractResult> {
  const name = (file.name || "").toLowerCase()
  const type = (file.type || "").toLowerCase()

  let raw: string

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    raw = await extractPdfText(file, onProgress)
  } else if (type.startsWith("image/") || /\.(png|jpg|jpeg|webp|bmp)$/.test(name)) {
    raw = await extractImageText(file, onProgress)
  } else if (type === "text/plain" || /\.(txt|md)$/.test(name)) {
    raw = await extractPlainText(file)
  } else {
    throw new Error(
      `Unsupported file type "${file.type || file.name}". Use PDF, PNG, JPG, or TXT.`,
    )
  }

  if (!raw) {
    throw new Error("No text could be extracted from this file.")
  }

  // Auto-clean only OCR paths (PDF-scan & image). Digital PDF text layers
  // & plain text files are already clean — leave them untouched.
  const wasOcr =
    type.startsWith("image/") ||
    /\.(png|jpg|jpeg|webp|bmp)$/.test(name) ||
    type === "application/pdf" ||
    name.endsWith(".pdf")

  const finalRaw = wasOcr ? autoClean(raw) : raw

  if (!finalRaw) {
    throw new Error("No usable text remained after cleaning. Try a higher-resolution scan.")
  }

  const truncated = finalRaw.length > maxChars
  return {
    text: truncated ? finalRaw.slice(0, maxChars) : finalRaw,
    originalLength: finalRaw.length,
    truncated,
  }
}
