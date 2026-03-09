import { useIntegrationStore } from "../../stores/integrationStore"

export default function JsonPastePanel() {
  const { rawJson, setRawJson, setError, setStatus, reset } = useIntegrationStore()

  function handleValidate() {
    if (!rawJson.trim()) { setError("JSON cannot be empty"); return }
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
    setStatus("idle")
    setError(null)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          value={rawJson}
          onChange={handleChange}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          style={{
            width:        "100%",
            minHeight:    280,
            resize:       "vertical",
            background:   "var(--bg-card)",
            border:       "1px solid var(--border)",
            borderRadius: 10,
            padding:      "16px 20px",
            fontSize:     12.5,
            lineHeight:   1.6,
            color:        "var(--text-body)",
            fontFamily:   "inherit",
            outline:      "none",
            boxSizing:    "border-box",
            transition:   "border-color 0.15s",
          }}
          onFocus={(e)  => e.currentTarget.style.borderColor = "var(--accent)"}
          onBlur={(e)   => e.currentTarget.style.borderColor = "var(--border)"}
        />

        {/* Clear button */}
        {rawJson && (
          <button
            onClick={() => { reset(); }}
            style={{
              position:     "absolute",
              top:          12,
              right:        12,
              background:   "var(--bg-inset)",
              border:       "1px solid var(--border)",
              borderRadius: 4,
              cursor:       "pointer",
              padding:      "4px 10px",
              fontSize:     11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color:         "var(--text-faint)",
              fontFamily:    "inherit",
              transition:    "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color       = "var(--text-body)"
              e.currentTarget.style.borderColor = "var(--border-muted)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color       = "var(--text-faint)"
              e.currentTarget.style.borderColor = "var(--border)"
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Action row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <ActionButton
          onClick={handleValidate}
          disabled={!rawJson.trim()}
          label="Validate JSON"
        />
        <SampleButton />
      </div>

    </div>
  )
}


// SampleButton
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
      style={{
        background:    "none",
        border:        "none",
        cursor:        "pointer",
        fontSize:      11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color:         "var(--text-faint)",
        fontFamily:    "inherit",
        transition:    "color 0.15s",
        padding:       0,
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-faint)"}
    >
      Load sample →
    </button>
  )
}


// ActionButton
function ActionButton({ onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding:       "8px 16px",
        borderRadius:  8,
        border:        "1px solid var(--border)",
        background:    "none",
        cursor:        disabled ? "not-allowed" : "pointer",
        fontSize:      12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontFamily:    "inherit",
        color:         disabled ? "var(--text-ghost)" : "var(--text-body)",
        transition:    "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "var(--accent)"
          e.currentTarget.style.color       = "var(--accent)"
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)"
        e.currentTarget.style.color       = disabled ? "var(--text-ghost)" : "var(--text-body)"
      }}
    >
      {label}
    </button>
  )
}


// Constants
const PLACEHOLDER = `Example... 

{  
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
  version:         "01.00.0000",
  description:     "Synchronizes orders from ERP system to Order Management System via REST.",
  pattern:         "APP_DRIVEN_ORCHESTRATION",
  triggers: [
    { name: "ReceiveOrder", type: "REST", connection: "ERP_REST_TRIGGER" }
  ],
  invokes: [
    { name: "SendToOMS",  type: "REST", connection: "OMS_REST_CONN", operation: "createOrder" },
    { name: "LogToDB",    type: "DB",   connection: "DB_CONN",        operation: "insertLog"   },
  ],
  faultHandlers: [
    { name: "HandleOMSFault",     faultName: "OMS_TIMEOUT",    action: "rethrow"       },
    { name: "HandleGenericFault", faultName: null,             action: "email_notify"  },
  ],
  variables: [
    { name: "orderPayload",  type: "object", scope: "global" },
    { name: "responseCode",  type: "string", scope: "local"  },
  ],
}