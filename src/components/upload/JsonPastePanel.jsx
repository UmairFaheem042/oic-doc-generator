import { useIntegrationStore } from "../../stores/integrationStore"

export default function JsonPastePanel() {
  const { rawJson, setRawJson, setError, setStatus, reset } = useIntegrationStore()

  // ── Validate on button click, not on change ──
  function handleValidate() {
    if (!rawJson.trim()) {
      setError("JSON cannot be empty")
      return
    }
    try {
      JSON.parse(rawJson)
      setError(null)
      setStatus("ready")
    } catch {
      setError("Invalid JSON — check syntax and try again")
    }
  }

  function handleChange(e) {
    setRawJson(e.target.value)
    // Reset status on every edit so stale "ready" doesn't linger
    setStatus("idle")
    setError(null)
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={rawJson}
          onChange={handleChange}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="
            w-full min-h-[280px] resize-y
            bg-[#0c0c0e] border border-[#1c1c1f] rounded-xl
            px-5 py-4 text-[12.5px] leading-relaxed
            text-[#e8e6e0] placeholder:text-[#2a2a2c]
            font-mono outline-none
            focus:border-[#ff8a00] transition-colors duration-200
          "
        />

        {/* Clear button — only shown when there is content */}
        {rawJson && (
          <button
            onClick={reset}
            className="
              absolute top-3 right-3
              text-[11px] text-[#3d3b38] hover:text-[#e8e6e0]
              bg-[#161618] hover:bg-[#1c1c1f]
              border border-[#1c1c1f] rounded px-2 py-1
              transition-all duration-150 tracking-wider uppercase
            "
          >
            Clear
          </button>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleValidate}
          disabled={!rawJson.trim()}
          className="
            text-[12px] tracking-widest uppercase
            px-4 py-2 rounded-lg border
            transition-all duration-150
            disabled:text-[#2a2a2c] disabled:border-[#161618] disabled:cursor-not-allowed
            enabled:text-[#e8e6e0] enabled:border-[#2a2a2c]
            enabled:hover:border-[#ff8a00] enabled:hover:text-[#ff8a00]
          "
        >
          Validate JSON
        </button>

        <SampleButton />
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────
// Sample loader — helps users understand the expected shape
// ─────────────────────────────────────────────

function SampleButton() {
  const { setRawJson, setStatus, setError } = useIntegrationStore()

  function loadSample() {
    setRawJson(JSON.stringify(SAMPLE_METADATA, null, 2))
    setStatus("idle")
    setError(null)
  }

  return (
    <button
      onClick={loadSample}
      className="
        text-[11px] tracking-widest uppercase
        text-[#3d3b38] hover:text-[#ff8a00]
        transition-colors duration-150
      "
    >
      Load sample →
    </button>
  )
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PLACEHOLDER = `{
  "integrationName": "Order Sync",
  "version": "01.00.0000",
  "description": "Syncs orders from ERP to OMS",
  "pattern": "APP_DRIVEN_ORCHESTRATION",
  "triggers": [...],
  "invokes": [...],
  "faultHandlers": [...],
  "variables": [...]
}`

const SAMPLE_METADATA = {
  integrationName: "Order Sync Integration",
  version: "01.00.0000",
  description: "Synchronizes orders from ERP system to Order Management System via REST.",
  pattern: "APP_DRIVEN_ORCHESTRATION",
  triggers: [
    { name: "ReceiveOrder", type: "REST", connection: "ERP_REST_TRIGGER" }
  ],
  invokes: [
    { name: "SendToOMS", type: "REST", connection: "OMS_REST_CONN", operation: "createOrder" },
    { name: "LogToDB", type: "DB", connection: "DB_CONN", operation: "insertLog" }
  ],
  faultHandlers: [
    { name: "HandleOMSFault", faultName: "OMS_TIMEOUT", action: "rethrow" },
    { name: "HandleGenericFault", faultName: null, action: "email_notify" }
  ],
  variables: [
    { name: "orderPayload", type: "object", scope: "global" },
    { name: "responseCode", type: "string", scope: "local" }
  ]
}