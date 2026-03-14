import { analyze } from "../analyzers/integrationAnalyzer"

export function generateMarkdown(metadata) {
  const sections = []

  // Header 
  sections.push(
    `# ${metadata.integrationName}`,
    [
      `**Version:** ${metadata.version}`,
      `**Pattern:** ${metadata.pattern}`,
      `**Completion:** ${metadata.percentComplete}%`,
      metadata.description ? `**Description:** ${metadata.description}` : null,
    ].filter(Boolean).join("  \n")
  )

  // Summary 
  sections.push(
    `## Summary`,
    buildTable(
      ["Metric", "Count"],
      [
        ["Triggers",       metadata.triggers.length],
        ["Invokes",        metadata.invokes.length],
        ["Fault Handlers", metadata.faultHandlers.length],
        ["Variables",      metadata.variables.length],
      ]
    )
  )

  // Flow Diagram
  sections.push(
    `## Integration Flow`,
    buildFlowDiagram(metadata)
  )

  // Analysis 
  const findings = analyze(metadata)
  if (findings.length > 0) {
    const rows = findings.map((f) => [
      SEVERITY_EMOJI[f.severity],
      `**${f.title}**`,
      f.detail,
      f.affected && f.affected.length > 0
        ? f.affected.map((a) => `\`${a}\``).join(", ")
        : "—",
    ])

    sections.push(
      `## Analysis`,
      buildTable(["", "Finding", "Detail", "Affected"], rows)
    )
  }

  // Triggers 
  if (metadata.triggers.length) {
    sections.push(
      `## Triggers`,
      buildTable(
        ["Name", "Connection", "Adapter", "Operation", "Security", "Status"],
        metadata.triggers.map((t) => [
          t.name,
          t.connection  || "—",
          t.adapterType || "—",
          t.operation   || "—",
          t.security    || "—",
          t.status      || "—",
        ])
      )
    )
  }

  // Invoke Connections 
  if (metadata.invokes.length) {
    sections.push(
      `## Invoke Connections`,
      buildTable(
        ["Name", "Connection", "Adapter", "Binding", "Operation", "Security", "Status"],
        metadata.invokes.map((i) => [
          i.name,
          i.connection  || "—",
          i.adapterType || "—",
          i.binding     || "—",
          i.operation   || "—",
          i.security    || "—",
          i.status      || "—",
        ])
      )
    )
  }

  // Fault Handlers 
  if (metadata.faultHandlers.length) {
    sections.push(
      `## Fault Handlers`,
      buildTable(
        ["Fault Name", "Action"],
        metadata.faultHandlers.map((f) => [
          f.faultName || "GenericFault",
          f.action    || "—",
        ])
      )
    )
  }

  // Variables 
  if (metadata.variables.length) {
    sections.push(
      `## Variables`,
      buildTable(
        ["Name", "Type", "Scope", "Primary"],
        metadata.variables.map((v) => [
          v.name  || "unnamed",
          v.type  || "—",
          v.scope || "—",
          v.primary ? "✓" : "—",
        ])
      )
    )
  }

  return sections.filter(Boolean).join("\n\n---\n\n")
}


// Flow diagram as ASCII art
function buildFlowDiagram(metadata) {
  const { triggers, invokes, faultHandlers } = metadata

  const mainNodes = [
    ...triggers.map((t) => ({ ...t, kind: "trigger" })),
    ...invokes.map((i)  => ({ ...i, kind: "invoke"  })),
  ]

  if (!mainNodes.length) return "_No nodes defined._"

  // Build main flow row
  const nodeBoxes = mainNodes.map((node) => {
    const kind  = node.kind === "trigger" ? "TRIGGER" : "INVOKE"
    const name  = truncate(node.name, 16)
    const conn  = truncate(node.connection || node.adapterType || "", 16)
    const width = 20

    return [
      `┌${"─".repeat(width)}┐`,
      `│ ${pad(kind, width - 2)} │`,
      `│ ${pad(name, width - 2)} │`,
      `│ ${pad(conn, width - 2)} │`,
      `└${"─".repeat(width)}┘`,
    ]
  })

  // Merge boxes side by side with arrows
  const height    = nodeBoxes[0].length
  const arrowRow  = Math.floor(height / 2)
  const connector = " ──▶ "

  const lines = Array.from({ length: height }, (_, row) => {
    return nodeBoxes.map((box, i) => {
      const isArrowRow = row === arrowRow
      const arrow      = isArrowRow && i < nodeBoxes.length - 1 ? connector : " ".repeat(connector.length)
      return box[row] + (i < nodeBoxes.length - 1 ? arrow : "")
    }).join("")
  })

  let diagram = "```\n" + lines.join("\n") + "\n```"

  // Fault handlers below
  if (faultHandlers.length > 0) {
    const faultWidth = 20
    const faultBoxes = faultHandlers.map((f) => {
      const name   = truncate(f.faultName || "GenericFault", 16)
      const action = truncate(f.action || "—", 16)
      return [
        `┌${"─".repeat(faultWidth)}┐`,
        `│ ${pad("FAULT", faultWidth - 2)} │`,
        `│ ${pad(name,   faultWidth - 2)} │`,
        `│ ${pad(action, faultWidth - 2)} │`,
        `└${"─".repeat(faultWidth)}┘`,
      ]
    })

    const faultLines = Array.from({ length: faultBoxes[0].length }, (_, row) => {
      return faultBoxes.map((box, i) => {
        return box[row] + (i < faultBoxes.length - 1 ? "   " : "")
      }).join("")
    })

    diagram +=
      "\n\n**Fault Handlers:**\n\n" +
      "```\n" +
      "        │ fault\n" +
      "        ▼\n" +
      faultLines.join("\n") +
      "\n```"
  }

  return diagram
}


// Helpers
function buildTable(headers, rows) {
  if (!rows.length) return "_None found._"

  const header    = `| ${headers.join(" | ")} |`
  const separator = `| ${headers.map(() => "---").join(" | ")} |`
  const body      = rows.map((row) => `| ${row.join(" | ")} |`).join("\n")

  return [header, separator, body].join("\n")
}

function truncate(str, max) {
  if (!str) return ""
  str = String(str)
  return str.length > max ? str.slice(0, max - 1) + "…" : str
}

function pad(str, width) {
  str = String(str || "")
  return str.length >= width ? str.slice(0, width) : str + " ".repeat(width - str.length)
}

const SEVERITY_EMOJI = {
  risk:       "🔴",
  suggestion: "🟡",
  info:       "🔵",
}