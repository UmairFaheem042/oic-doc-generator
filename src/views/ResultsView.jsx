import { useState, useCallback }    from "react"
import { useIntegrationStore }      from "../stores/integrationStore"
import { generateMarkdown }         from "../generators/markdownGenerator"
import { generatePdf }              from "../generators/pdfGenerator"
import FlowDiagram                  from "../components/results/FlowDiagram"
import AnalysisPanel                from "../components/results/AnalysisPanel"
import Toast                        from "../components/ui/Toast"
import EmptyState                   from "../components/ui/EmptyState"

export default function ResultsView() {
  const { parsedMetadata, navigate } = useIntegrationStore()
  const [toast, setToast]            = useState(null)
  const showToast                    = useCallback((msg) => setToast(msg), [])

  if (!parsedMetadata) return null

  const markdown = generateMarkdown(parsedMetadata)

  function handleCopyMarkdown() {
    navigator.clipboard.writeText(markdown)
    showToast("Markdown copied")
  }

  function handleDownloadMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `${parsedMetadata.integrationName.replace(/\s+/g, "_")}_docs.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadPdf() {
    generatePdf(parsedMetadata)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        
{/* Header */}
<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>

  {/* Left — title */}
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <CheckIcon />
      <span style={{
        fontSize: 10, letterSpacing: "0.25em",
        color: "var(--green)", textTransform: "uppercase",
      }}>
        Parsed Successfully
      </span>
    </div>
    <h2 style={{
      margin: 0, fontSize: 26, fontWeight: 700,
      letterSpacing: "-0.03em", color: "var(--text-primary)",
    }}>
      {parsedMetadata.integrationName}
    </h2>
    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-faint)" }}>
      v{parsedMetadata.version}
      {" · "}{parsedMetadata.pattern}
      {" · "}{parsedMetadata.percentComplete}% complete
    </p>
  </div>

  {/* Right — breadcrumb */}
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
    <button
      onClick={() => navigate("upload")}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 11, letterSpacing: "0.08em",
        color: "var(--text-faint)", fontFamily: "inherit",
        padding: 0, transition: "color 0.15s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-faint)"}
    >
      Upload
    </button>
    <span style={{ color: "var(--border-muted)", fontSize: 11 }}>→</span>
    <span style={{
      fontSize: 11, letterSpacing: "0.08em",
      color: "var(--text-body)",
    }}>
      Results
    </span>
  </div>

</div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <SummaryCard label="Triggers"       value={parsedMetadata.triggers.length}      />
        <SummaryCard label="Invokes"        value={parsedMetadata.invokes.length}       />
        <SummaryCard label="Fault Handlers" value={parsedMetadata.faultHandlers.length} />
        <SummaryCard label="Variables"      value={parsedMetadata.variables.length}     />
      </div>

      {/* Flow diagram */}
      <Section title="Integration Flow">
        <div style={{
          background:   "var(--bg-card)",
          border:       "1px solid var(--border)",
          borderRadius: 12,
          padding:      20,
        }}>
          <FlowDiagram />
        </div>
      </Section>

      {/* Analysis */}
      <Section title="Analysis">
        <AnalysisPanel metadata={parsedMetadata} />
      </Section>

      {/* Triggers */}
      <Section title="Triggers" count={parsedMetadata.triggers.length}>
        {!parsedMetadata.triggers.length ? (
          <EmptyState message="No triggers defined" />
        ) : (
          <Table
            headers={["Name", "Connection", "Adapter", "Operation", "Security", "Status"]}
            rows={parsedMetadata.triggers.map((t) => [
              t.name,
              t.connection  || "—",
              t.adapterType || "—",
              t.operation   || "—",
              t.security    || "—",
              <StatusBadge key={t.name} status={t.status} />,
            ])}
          />
        )}
      </Section>

      {/* Invokes */}
      <Section title="Invoke Connections" count={parsedMetadata.invokes.length}>
        {!parsedMetadata.invokes.length ? (
          <EmptyState message="No invoke connections defined" />
        ) : (
          <Table
            headers={["Name", "Connection", "Adapter", "Binding", "Operation", "Security", "Status"]}
            rows={parsedMetadata.invokes.map((i) => [
              i.name,
              i.connection  || "—",
              i.adapterType || "—",
              i.binding     || "—",
              i.operation   || "—",
              i.security    || "—",
              <StatusBadge key={i.name} status={i.status} />,
            ])}
          />
        )}
      </Section>

      {/* Fault Handlers */}
      <Section title="Fault Handlers" count={parsedMetadata.faultHandlers.length}>
        {!parsedMetadata.faultHandlers.length ? (
          <EmptyState message="No fault handlers defined" />
        ) : (
          <Table
            headers={["Fault Name", "Action"]}
            rows={parsedMetadata.faultHandlers.map((f) => [
              f.faultName || "GenericFault",
              f.action,
            ])}
          />
        )}
      </Section>

      {/* Variables */}
      <Section title="Variables" count={parsedMetadata.variables.length}>
        {!parsedMetadata.variables.length ? (
          <EmptyState message="No variables defined" />
        ) : (
          <Table
            headers={["Name", "Type", "Scope", "Primary"]}
            rows={parsedMetadata.variables.map((v) => [
              v.name  || "unnamed",
              v.type,
              v.scope || "—",
              v.primary ? <PrimaryBadge key={v.name} /> : "—",
            ])}
          />
        )}
      </Section>

      {/* Generated Markdown */}
      <Section title="Generated Documentation">
        <pre style={{
          background:   "var(--bg-card)",
          border:       "1px solid var(--border)",
          borderRadius: 12,
          padding:      24,
          fontSize:     11.5,
          lineHeight:   1.6,
          color:        "var(--text-muted)",
          overflowX:    "auto",
          whiteSpace:   "pre-wrap",
          fontFamily:   "inherit",
          margin:       0,
        }}>
          {markdown}
        </pre>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <ActionButton onClick={handleCopyMarkdown}     label="Copy Markdown" />
          <ActionButton onClick={handleDownloadMarkdown} label="Download .md"  primary />
          <ActionButton onClick={handleDownloadPdf}      label="Download PDF"  primary />
        </div>
      </Section>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────

function Section({ title, count, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <h3 style={{
          margin: 0, fontSize: 13, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--text-body)",
        }}>
          {title}
        </h3>
        {count !== undefined && (
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 4,
            background: "var(--bg-inset)", color: "var(--text-faint)",
            letterSpacing: "0.06em",
          }}>
            {count}
          </span>
        )}
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{
                textAlign: "left", paddingBottom: 8, paddingRight: 24,
                fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--text-faint)", fontWeight: "normal",
                borderBottom: "1px solid var(--border)",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              style={{ borderBottom: "1px solid var(--bg-inset)", transition: "background 0.1s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-alt)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: "10px 24px 10px 0",
                  color: "var(--text-muted)", verticalAlign: "top",
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────
// Cards + Badges
// ─────────────────────────────────────────────

function SummaryCard({ label, value }) {
  return (
    <div style={{
      background:   "var(--bg-card)",
      border:       "1px solid var(--border)",
      borderRadius: 12,
      padding:      16,
    }}>
      <p style={{
        margin: 0, fontSize: 28, fontWeight: 700,
        color: "var(--accent)", letterSpacing: "-0.04em",
      }}>
        {value}
      </p>
      <p style={{
        margin: "4px 0 0", fontSize: 10,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--text-faint)",
      }}>
        {label}
      </p>
    </div>
  )
}

function StatusBadge({ status }) {
  const isConfigured = status === "CONFIGURED"
  return (
    <span style={{
      fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "2px 8px", borderRadius: 4,
      background: isConfigured ? "var(--green-bg)" : "rgba(249,115,22,0.1)",
      color:      isConfigured ? "var(--green)"    : "#f97316",
    }}>
      {status || "unknown"}
    </span>
  )
}

function PrimaryBadge() {
  return (
    <span style={{
      fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "2px 8px", borderRadius: 4,
      background: "var(--accent-bg)", color: "var(--accent)",
    }}>
      Primary
    </span>
  )
}

function ActionButton({ onClick, label, primary = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px", borderRadius: 8,
        border: "1px solid", cursor: "pointer",
        fontSize: 11, letterSpacing: "0.08em",
        textTransform: "uppercase", fontFamily: "inherit",
        transition: "all 0.15s",
        background:  primary ? "var(--accent)"       : "transparent",
        borderColor: primary ? "var(--accent)"       : "var(--border-muted)",
        color:       primary ? "var(--bg)"           : "var(--text-muted)",
      }}
      onMouseEnter={(e) => {
        if (primary) {
          e.currentTarget.style.background  = "var(--accent-hover)"
          e.currentTarget.style.borderColor = "var(--accent-hover)"
        } else {
          e.currentTarget.style.borderColor = "var(--accent)"
          e.currentTarget.style.color       = "var(--accent)"
        }
      }}
      onMouseLeave={(e) => {
        if (primary) {
          e.currentTarget.style.background  = "var(--accent)"
          e.currentTarget.style.borderColor = "var(--accent)"
        } else {
          e.currentTarget.style.borderColor = "var(--border-muted)"
          e.currentTarget.style.color       = "var(--text-muted)"
        }
      }}
    >
      {label}
    </button>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="var(--green)" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}