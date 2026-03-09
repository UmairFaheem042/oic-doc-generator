import { useIntegrationStore } from "./stores/integrationStore"
import { parseIar }            from "./parsers/iarParser"
import { parseJson }           from "./parsers/jsonParser"
import AppShell                from "./components/layout/AppShell"
import UploadPanel             from "./components/upload/UploadPanel"
import JsonPastePanel          from "./components/upload/JsonPastePanel"
import ResultsView             from "./components/results/ResultsView"
import Skeleton                from "./components/ui/Skeleton"

export default function App() {
  const {
    inputMode, setInputMode,
    rawFile, rawJson,
    status, error, parsedMetadata,
    reset, setStatus, setError, setParsedMetadata,
  } = useIntegrationStore()

  // Tab switch
  function handleTabSwitch(mode) {
    reset()
    setInputMode(mode)
  }

  // Parse & proceed
  async function handleGenerate() {
    try {
      setStatus("parsing")

      // Temporary delay to see skeleton — remove after testing
    await new Promise((r) => setTimeout(r, 2000))

      const metadata =
        inputMode === "file"
          ? await parseIar(rawFile)
          : parseJson(rawJson)
      setParsedMetadata(metadata)
    } catch (err) {
      setError(err.message)
    }
  }

  const isParsing  = status === "parsing"
  const canProceed = status === "ready"

  return (
    <AppShell>
      {parsedMetadata ? (
        <ResultsView />
      ) : isParsing ? (
        <Skeleton />
      ) : (
        <>
          {/* Page header */}
          <header style={{ marginBottom: 52 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <ZapIcon />
              <span style={{
                fontSize: 10, letterSpacing: "0.25em",
                color: "var(--accent)", textTransform: "uppercase",
              }}>
                Oracle Integration Cloud
              </span>
            </div>

            <h1 style={{
              fontSize: 34, fontWeight: 800, letterSpacing: "-0.04em",
              lineHeight: 1.15, color: "var(--text-primary)", margin: 0,
            }}>
              Integration Doc<br />
              <span style={{ color: "var(--accent)" }}>Generator</span>
            </h1>

            <p style={{
              marginTop: 14, fontSize: 12.5, lineHeight: 1.75,
              color: "var(--text-dim)", maxWidth: 480,
            }}>
              Upload an OIC export{" "}
              <span style={{ color: "var(--accent)" }}>.iar</span>{" "}
              or paste integration metadata JSON to generate flow summaries,
              component lists, and full Markdown documentation.
            </p>
          </header>

          {/* Tabs */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            marginBottom: 28,
          }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 22px", background: "none", border: "none",
                  cursor: "pointer", fontSize: 12, letterSpacing: "0.06em",
                  textTransform: "uppercase", marginBottom: -1,
                  color:        inputMode === tab.id ? "var(--accent)"  : "var(--text-faint)",
                  borderBottom: inputMode === tab.id
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                  transition: "color 0.15s",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active panel */}
          {inputMode === "file" ? <UploadPanel /> : <JsonPastePanel />}

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginTop: 12, color: "var(--red)", fontSize: 12,
            }}>
              <AlertIcon />
              {error}
            </div>
          )}

          {/* Generate button */}
          <div style={{
            borderTop: "1px solid var(--border)",
            marginTop: 40, paddingTop: 32,
          }}>
            <button
              onClick={handleGenerate}
              disabled={!canProceed || isParsing}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 28px", borderRadius: 12,
                fontSize: 12, fontWeight: 700,
                letterSpacing: "0.05em", textTransform: "uppercase",
                cursor: canProceed && !isParsing ? "pointer" : "not-allowed",
                transition: "all 0.2s", border: "1px solid",
                fontFamily: "inherit",
                background:   canProceed && !isParsing ? "var(--accent)"        : "transparent",
                borderColor:  canProceed && !isParsing ? "var(--accent)"        : "var(--border)",
                color:        canProceed && !isParsing ? "var(--bg)"            : "var(--text-ghost)",
              }}
            >
              {isParsing ? <SpinnerIcon /> : <ZapIcon small />}
              {isParsing ? "Parsing..." : "Generate Documentation"}
              {!isParsing && <ChevronIcon />}
            </button>

            <p style={{
              marginTop: 10, fontSize: 11,
              color: "var(--text-ghost)", letterSpacing: "0.05em",
            }}>
              {inputMode === "file"
                ? "Supports Oracle Integration Archive exports · .iar"
                : "Paste exported OIC integration metadata JSON"
              }
            </p>
          </div>
        </>
      )}
    </AppShell>
  )
}

// Constants
const TABS = [
  {
    id: "file",
    label: "Upload .iar",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: "json",
    label: "Paste JSON",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
  },
]

// Icons
function ZapIcon({ small = false }) {
  const size = small ? 13 : 15
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor" stroke="currentColor" strokeWidth="1">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8"  x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}