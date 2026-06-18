import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { extractFile } from "../../lib/extractText"
import "./FileDropZone.css"

interface Props {
  onExtracted: (text: string) => void
  maxChars: number
  disabled?: boolean
}

type Status = "empty" | "extracting" | "complete" | "error"

export default function FileDropZone({ onExtracted, maxChars, disabled }: Props) {
  const [status, setStatus] = useState<Status>("empty")
  const [filename, setFilename] = useState<string>("")
  const [progress, setProgress] = useState<number>(0)
  const [phase, setPhase] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (disabled) return
    setFilename(file.name)
    setStatus("extracting")
    setProgress(0)
    setPhase("Preparing")
    setErrorMsg("")
    setNote("")

    try {
      const result = await extractFile(file, maxChars, (pct, ph) => {
        setProgress(Math.floor(pct))
        if (ph) setPhase(ph)
      })
      onExtracted(result.text)
      setStatus("complete")
      setProgress(100)
      if (result.truncated) {
        setNote(
          `Extracted ${result.originalLength.toLocaleString()} characters, truncated to ${maxChars.toLocaleString()} for evaluation. Edit below if needed.`,
        )
      } else {
        setNote(
          `Extracted ${result.originalLength.toLocaleString()} characters. Review & edit below before submitting.`,
        )
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Extraction failed")
      setStatus("error")
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ""
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleClear = () => {
    setStatus("empty")
    setFilename("")
    setProgress(0)
    setPhase("")
    setErrorMsg("")
    setNote("")
  }

  return (
    <div
      className={`file-drop-zone ${dragOver ? "drag-over" : ""} status-${status}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,image/*,text/plain"
        onChange={handleChange}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {status === "empty" && (
        <button
          type="button"
          className="file-drop-empty"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <div className="file-drop-icon">[ &#8593; ]</div>
          <div className="file-drop-prompt">
            Drag a credential file here, or click to upload
          </div>
          <div className="file-drop-types">
            PDF &middot; PNG &middot; JPG &middot; TXT &mdash; scanned PDFs supported via OCR
          </div>
        </button>
      )}

      {status === "extracting" && (
        <div className="file-drop-progress">
          <div className="file-drop-filename">{filename}</div>
          <div className="file-drop-status blink">
            {phase ? `${phase.toUpperCase()} — ${progress}%` : `EXTRACTING — ${progress}%`}
          </div>
          <div className="file-drop-bar">
            <div className="file-drop-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === "complete" && (
        <div className="file-drop-complete">
          <div className="file-drop-filename">{filename}</div>
          <div className="file-drop-status complete">[ &#10003; ] TEXT EXTRACTED</div>
          {note && <div className="file-drop-note">{note}</div>}
          <button type="button" className="file-drop-clear" onClick={handleClear}>
            UPLOAD A DIFFERENT FILE
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="file-drop-error">
          <div className="file-drop-filename">{filename}</div>
          <div className="file-drop-status error">[ &times; ] {errorMsg}</div>
          <button type="button" className="file-drop-clear" onClick={handleClear}>
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  )
}
