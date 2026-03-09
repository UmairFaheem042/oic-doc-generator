import { useCallback, useRef } from "react"
import { useIntegrationStore } from "../../stores/integrationStore"

const MAX_FILE_SIZE = 50 * 1024 * 1024

export default function UploadPanel() {
  const { rawFile, setRawFile, setError, setStatus, reset } = useIntegrationStore()
  const fileRef = useRef(null)

  function validate(file) {
    if (!file)                         return "No file selected"
    if (!file.name.endsWith(".iar"))   return "Only .iar files are supported"
    if (file.size > MAX_FILE_SIZE)     return "File exceeds 50MB limit"
    return null
  }

  const handleFile = useCallback((file) => {
    const error = validate(file)
    if (error) { setError(error); return }
    setRawFile(file)
    setStatus("ready")
  }, [setRawFile, setError, setStatus])

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

  if (rawFile) return <FilePreview file={rawFile} onClear={reset} />

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".iar"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div
        onClick={() => fileRef.current.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="upload-zone"
        style={{
          border:        "2px dashed var(--border)",
          borderRadius:  10,
          padding:       "72px 40px",
          textAlign:     "center",
          cursor:        "pointer",
          transition:    "all 0.2s",
          background:    "var(--bg-card)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)"
          e.currentTarget.style.background  = "var(--accent-bg)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)"
          e.currentTarget.style.background  = "var(--bg-card)"
        }}
      >
        <UploadIcon />

        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-dim)" }}>
          <span style={{ color: "var(--accent)", cursor: "pointer" }}>
            Choose .iar file
          </span>
          {" "}or drag and drop here
        </p>

        <p style={{
          marginTop: 8, fontSize: 11,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--text-ghost)",
        }}>
          Oracle Integration Archive · Max 50MB
        </p>
      </div>
    </div>
  )
}


// FilePreview
function FilePreview({ file, onClear }) {
  const sizeKb = (file.size / 1024).toFixed(1)

  return (
    <div style={{
      background:   "var(--bg-card)",
      border:       "1px solid var(--border)",
      borderRadius: 10,
      padding:      20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40, height: 40,
            background: "var(--bg-inset)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileIcon />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-body)" }}>
              {file.name}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--text-faint)" }}>
              {sizeKb} KB
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          style={{
            background: "none", border: "none",
            cursor: "pointer", padding: 4,
            color: "var(--text-faint)",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-body)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-faint)"}
        >
          <CloseIcon />
        </button>
      </div>

      <div style={{
        marginTop: 14,
        display: "flex", alignItems: "center", gap: 6,
        color: "var(--green)", fontSize: 12,
      }}>
        <CheckIcon />
        File validated — ready to parse
      </div>
    </div>
  )
}


// Icons
function UploadIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24"
      fill="none" stroke="var(--border-muted)" strokeWidth="1.5"
      style={{ margin: "0 auto", display: "block" }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9"  y1="15" x2="15" y2="15" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="var(--accent)" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
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