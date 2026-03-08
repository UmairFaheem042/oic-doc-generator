import { useIntegrationStore } from "./stores/integrationStore"
import { parseIar } from "./parsers/iarParser"
import { parseJson } from "./parsers/jsonParser"
import AppShell from "./components/layout/AppShell"
import UploadPanel from "./components/upload/UploadPanel"
import JsonPastePanel from "./components/upload/JsonPastePanel"
import ResultsView from "./components/results/ResultsView"
import Skeleton from "./components/ui/Skeleton"

export default function App() {
  const {
    inputMode, setInputMode,
    rawFile, rawJson,
    status, error, parsedMetadata,
    reset, setStatus, setError, setParsedMetadata,
  } = useIntegrationStore()

  // console.log("status:", status, "| rawFile:", rawFile?.name, "| canProceed:", status === "ready")

  // ── Tab switch ───────────────────────────────
  function handleTabSwitch(mode) {
    reset()
    setInputMode(mode)
  }

  // ── Parse & proceed ──────────────────────────
  async function handleGenerate() {
    try {
      setStatus("parsing")
      // Temporary delay to see skeleton — remove after testing
      await new Promise((r) => setTimeout(r, 1000))
  
      const metadata =
        inputMode === "file"
          ? await parseIar(rawFile)
          : parseJson(rawJson)
  
      // console.log("parsed metadata:", JSON.stringify(metadata, null, 2)) // ADD THIS
  
      setParsedMetadata(metadata)
  
    } catch (err) {
      setError(err.message)
    }
  }

  const isParsing  = status === "parsing"
  const canProceed = status === "ready"

  return (
    <AppShell>
      {parsedMetadata ? (<ResultsView/>) : isParsing ? (<Skeleton/>) : (
        <> 
        <header className="mb-14">
          <div className="flex items-center gap-2 mb-4">
            <ZapIcon />
            <span className="text-[10px] tracking-[0.25em] text-[#ff8a00] uppercase">
              Oracle Integration Cloud
            </span>
          </div>

          <h1 className="text-[34px] font-bold tracking-[-0.04em] leading-[1.15] text-[#f0ede8]">
            Integration Doc<br />
            <span className="text-[#ff8a00]">Generator</span>
          </h1>

          <p className="mt-4 text-[12.5px] text-[#555350] leading-[1.75] max-w-[480px]">
            Upload an OIC export <span className="text-[#ff8a00]">.iar</span> or
            paste integration metadata JSON to generate flow summaries,
            component lists, and full Markdown documentation.
          </p>
        </header>

        {/* Input mode tabs */}
        <div className="flex border-b border-[#161618] mb-7">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-3 text-[12px] tracking-widest uppercase
                border-b-2 -mb-px transition-colors duration-150
                ${inputMode === tab.id
                  ? "text-[#ff8a00] border-[#ff8a00]"
                  : "text-[#3d3b38] border-transparent hover:text-[#6b6965]"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active panel */}
        {inputMode === "file"
          ? <UploadPanel />
          : <JsonPastePanel />
        }

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-[#ef4444] text-[12px]">
            <AlertIcon />
            {error}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[#161618] mt-10 pt-8">

          <button
            onClick={handleGenerate}
            disabled={!canProceed || isParsing}
            className={`
              flex items-center gap-3 px-7 py-4 rounded-xl
              text-[12px] font-bold tracking-widest uppercase
              transition-all duration-200 border
              ${canProceed && !isParsing
                ? "bg-[#ff8a00] border-[#ff8a00] text-[#080809] hover:bg-[#e67e00] hover:border-[#e67e00]"
                : "bg-transparent border-[#1c1c1f] text-[#2a2a2c] cursor-not-allowed"
              }
            `}
          >
            {isParsing ? <SpinnerIcon /> : <ZapIcon small />}
            {isParsing ? "Parsing..." : "Generate Documentation"}
            {!isParsing && <ChevronIcon />}
          </button>

          <p className="mt-3 text-[11px] text-[#2a2a2c] tracking-wider">
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

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const TABS = [
  {
    id: "file",
    label: "Upload .iar",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2">
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
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
  },
]

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

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
      <line x1="12" y1="8" x2="12" y2="12" />
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