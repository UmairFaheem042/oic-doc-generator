import { useCallback, useRef } from "react"
import { useIntegrationStore } from "../../stores/integrationStore"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function UploadPanel() {
  const { rawFile, setRawFile, setError, setStatus, reset } = useIntegrationStore()
  const fileRef = useRef(null)

  // ── Validation ──────────────────────────────
  function validate(file) {
    if (!file) return "No file selected"
    if (!file.name.endsWith(".iar")) return "Only .iar files are supported"
    if (file.size > MAX_FILE_SIZE) return "File exceeds 50MB limit"
    return null
  }

  // ── Handler ─────────────────────────────────
  const handleFile = useCallback((file) => {
    const error = validate(file)
    if (error) {
      setError(error)
      return
    }
    setRawFile(file)
    setStatus("ready")
  }, [setRawFile, setError, setStatus])

  // ── Drag & Drop ──────────────────────────────
  function onDragOver(e) {
    e.preventDefault()
    e.currentTarget.dataset.drag = "true"
  }

  function onDragLeave(e) {
    e.currentTarget.dataset.drag = "false"
  }

  function onDrop(e) {
    e.preventDefault()
    e.currentTarget.dataset.drag = "false"
    handleFile(e.dataTransfer.files[0])
  }

  // ── Render ───────────────────────────────────
  if (rawFile) return <FilePreview file={rawFile} onClear={reset} />

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".iar"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div
        onClick={() => fileRef.current.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="
          group border-2 border-dashed border-[#1c1c1f] rounded-xl
          px-10 py-20 text-center cursor-pointer
          transition-all duration-200
          hover:border-[#ff8a00] hover:bg-[rgba(255,138,0,0.03)]
          data-[drag=true]:border-[#ff8a00] data-[drag=true]:bg-[rgba(255,138,0,0.03)]
        "
      >
        <UploadIcon />

        <p className="mt-4 text-[13px] text-[#555350]">
          <span className="text-[#ff8a00]">Choose .iar file</span>
          {" "}or drag and drop here
        </p>

        <p className="mt-2 text-[11px] tracking-widest text-[#2a2a2c] uppercase">
          Oracle Integration Archive · Max 50MB
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function FilePreview({ file, onClear }) {
  const sizeKb = (file.size / 1024).toFixed(1)

  return (
    <div className="bg-[#0c0c0e] border border-[#1c1c1f] rounded-xl p-5">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#161618] rounded-lg flex items-center justify-center">
            <FileIcon />
          </div>
          <div>
            <p className="text-[13px] text-[#e8e6e0]">{file.name}</p>
            <p className="text-[11px] text-[#3d3b38] mt-0.5">{sizeKb} KB</p>
          </div>
        </div>

        <button
          onClick={onClear}
          className="text-[#3d3b38] hover:text-[#e8e6e0] transition-colors p-1"
          aria-label="Remove file"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[#22c55e] text-[12px]">
        <CheckIcon />
        File validated — ready to parse
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg className="mx-auto text-[#222224] group-hover:text-[#ff8a00] transition-colors duration-200"
      width="44" height="44" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="#ff8a00" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}