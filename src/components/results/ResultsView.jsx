import { useIntegrationStore } from "../../stores/integrationStore"
import { generateMarkdown } from "../../generators/markdownGenerator"
import { generatePdf } from "../../generators/pdfGenerator"

export default function ResultsView() {
  const { parsedMetadata, reset } = useIntegrationStore()

  if (!parsedMetadata) return null

  const markdown = generateMarkdown(parsedMetadata)

  function handleCopyMarkdown() {
    navigator.clipboard.writeText(markdown)
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
    <div className="flex flex-col gap-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckIcon />
            <span className="text-[10px] tracking-[0.25em] text-[#22c55e] uppercase">
              Parsed Successfully
            </span>
          </div>
          <h2 className="text-[26px] font-bold tracking-[-0.03em] text-[#f0ede8]">
            {parsedMetadata.integrationName}
          </h2>
          <p className="text-[12px] text-[#3d3b38] mt-1">
            v{parsedMetadata.version} · {parsedMetadata.pattern} · {parsedMetadata.percentComplete}% complete
          </p>
        </div>

        <button
          onClick={reset}
          className="text-[11px] tracking-widest uppercase text-[#3d3b38] hover:text-[#e8e6e0] transition-colors duration-150 mt-1"
        >
          ← New
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Triggers"      value={parsedMetadata.triggers.length}      />
        <SummaryCard label="Invokes"       value={parsedMetadata.invokes.length}       />
        <SummaryCard label="Fault Handlers" value={parsedMetadata.faultHandlers.length} />
        <SummaryCard label="Variables"     value={parsedMetadata.variables.length}     />
      </div>

      {/* Triggers */}
      <Section title="Triggers" count={parsedMetadata.triggers.length}>
        <Table
          headers={["Name", "Connection", "Adapter", "Operation", "Security", "Status"]}
          rows={parsedMetadata.triggers.map((t) => [
            t.name,
            t.connection || "—",
            t.adapterType,
            t.operation  || "—",
            t.security   || "—",
            <StatusBadge key={t.name} status={t.status} />,
          ])}
        />
      </Section>

      {/* Invokes */}
      <Section title="Invoke Connections" count={parsedMetadata.invokes.length}>
        <Table
          headers={["Name", "Connection", "Adapter", "Binding", "Operation", "Security", "Status"]}
          rows={parsedMetadata.invokes.map((i) => [
            i.name,
            i.connection || "—",
            i.adapterType,
            i.binding    || "—",
            i.operation  || "—",
            i.security   || "—",
            <StatusBadge key={i.name} status={i.status} />,
          ])}
        />
      </Section>

      {/* Fault Handlers */}
      <Section title="Fault Handlers" count={parsedMetadata.faultHandlers.length}>
        <Table
          headers={["Fault Name", "Action"]}
          rows={parsedMetadata.faultHandlers.map((f) => [
            f.faultName || "GenericFault",
            f.action,
          ])}
        />
      </Section>

      {/* Variables */}
      <Section title="Variables" count={parsedMetadata.variables.length}>
        <Table
          headers={["Name", "Type", "Scope", "Primary"]}
          rows={parsedMetadata.variables.map((v) => [
            v.name  || "unnamed",
            v.type,
            v.scope || "—",
            v.primary ? <PrimaryBadge key={v.name} /> : "—",
          ])}
        />
      </Section>

      {/* Generated Markdown */}
      <Section title="Generated Documentation">
        <div className="relative">
          {/* <pre className="
            bg-[#0c0c0e] border border-[#1c1c1f] rounded-xl
            p-6 text-[11.5px] leading-relaxed text-[#a8a49e]
            overflow-x-auto whitespace-pre-wrap
          ">
            {markdown}
          </pre> */}

          {/* Actions */}
          <div className="flex gap-3 mt-3">
            {/* <ActionButton onClick={handleCopyMarkdown} label="Copy Markdown" /> */}
            <ActionButton onClick={handleDownloadMarkdown} label="Download .md" />
            <ActionButton onClick={handleDownloadPdf}      label="Download PDF" primary />
          </div>
        </div>
      </Section>

    </div>
  )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Section({ title, count, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#e8e6e0]">
          {title}
        </h3>
        {count !== undefined && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#161618] text-[#3d3b38] tracking-widest">
            {count}
          </span>
        )}
        <div className="flex-1 h-px bg-[#161618]" />
      </div>
      {children}
    </div>
  )
}

function Table({ headers, rows }) {
  if (!rows.length) {
    return <p className="text-[12px] text-[#2a2a2c] italic">None found</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="
                text-left text-[10px] tracking-widest uppercase
                text-[#3d3b38] pb-2 pr-6 font-normal border-b border-[#161618]
              ">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#0e0e10] hover:bg-[#0e0e10] transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-6 text-[#a8a49e] align-top">
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

function SummaryCard({ label, value }) {
  return (
    <div className="bg-[#0c0c0e] border border-[#1c1c1f] rounded-xl p-4">
      <p className="text-[28px] font-bold text-[#ff8a00] tracking-[-0.04em]">{value}</p>
      <p className="text-[10px] tracking-widest uppercase text-[#3d3b38] mt-1">{label}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const isConfigured = status === "CONFIGURED"
  return (
    <span className={`
      text-[10px] tracking-widest uppercase px-2 py-0.5 rounded
      ${isConfigured
        ? "bg-[#0f2a1a] text-[#22c55e]"
        : "bg-[#2a1a0f] text-[#f97316]"
      }
    `}>
      {status || "unknown"}
    </span>
  )
}

function PrimaryBadge() {
  return (
    <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded bg-[#1a1a0f] text-[#ff8a00]">
      Primary
    </span>
  )
}

function ActionButton({ onClick, label, primary = false }) {
  return (
    <button
      onClick={onClick}
      className={`
        text-[11px] tracking-widest uppercase px-4 py-2 rounded-lg border
        transition-all duration-150
        ${primary
          ? "bg-[#ff8a00] border-[#ff8a00] text-[#080809] hover:bg-[#e67e00]"
          : "bg-transparent border-[#2a2a2c] text-[#a8a49e] hover:border-[#ff8a00] hover:text-[#ff8a00]"
        }
      `}
    >
      {label}
    </button>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="#22c55e" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}